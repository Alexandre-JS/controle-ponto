import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Employee, Attendance, WorkSchedule } from '../models/employee.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly EMPLOYEES_TABLE = 'employees';
  private readonly ATTENDANCE_TABLE = 'attendance';
  private readonly SCHEDULE_TABLE = 'work_schedule';
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  private generateEmployeeCode(): string {
    const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `AEM${randomNumber}`;
  }

  async createEmployee(employee: Employee) {
    console.log('Criando funcionário:', employee);
    const newCode = this.generateEmployeeCode();
    
    try {
      const employeeData = {
        name: employee.name,
        position: employee.position,
        internal_code: newCode,
        department: employee.department,
        created_at: new Date().toISOString()
      };

      // Instead of checking for existing code first, handle potential conflicts in the insert
      const { data, error } = await this.supabase
        .from(this.EMPLOYEES_TABLE)
        .insert(employeeData)
        .select()
        .single();

      if (error) {
        // If there's a unique constraint violation, try again with a new code
        if (error.code === '23505') {
          employeeData.internal_code = this.generateEmployeeCode();
          const retryResult = await this.supabase
            .from(this.EMPLOYEES_TABLE)
            .insert(employeeData)
            .select()
            .single();
            
          if (retryResult.error) throw retryResult.error;
          return retryResult.data;
        }
        throw error;
      }

      console.log('Funcionário criado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro detalhado:', error);
      throw error;
    }
  }

  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await this.supabase
      .from(this.EMPLOYEES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findEmployeeByCode(code: string) {
    try {
      console.log('Buscando funcionário com código:', code);
      const { data, error } = await this.supabase
        .from(this.EMPLOYEES_TABLE)
        .select('*')
        .eq('internal_code', code.toUpperCase());

      if (error) {
        console.error('Erro na busca:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('Nenhum funcionário encontrado com o código:', code);
        return null;
      }

      console.log('Funcionário encontrado:', data[0]);
      return data[0]; // Return first match
    } catch (error) {
      console.error('Erro ao buscar funcionário:', error);
      return null;
    }
  }

  async registerAttendance(employeeCode: string, authMethod: 'code' | 'face' | 'fingerprint') {
    try {
      const employee = await this.findEmployeeByCode(employeeCode);
      if (!employee) {
        throw new Error('Funcionário não encontrado. Verifique o código informado.');
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().substring(0, 5);

      // Check if employee already has attendance today
      const { data: existingAttendances, error: searchError } = await this.supabase
        .from(this.ATTENDANCE_TABLE)
        .select('*')
        .eq('employee_id', employee.id)
        .eq('date', today);

      if (searchError) throw searchError;

      const existingAttendance = existingAttendances?.[0];
      let attendanceData: any;
      const workSchedule = await this.getWorkSchedule();

      if (!existingAttendance) {
        // First check-in of the day
        const lateMinutes = this.calculateLateMinutes(currentTime, workSchedule.start_time);
        attendanceData = {
          employee_id: employee.id,
          date: today,
          check_in: currentTime,
          status: lateMinutes > 0 ? 'Atrasado' : 'No horário',
          late_minutes: lateMinutes,
          auth_method: authMethod,
          created_at: now.toISOString()
        };
      } else if (!existingAttendance.check_out && now.getHours() >= 12) {
        // Check-out
        attendanceData = {
          id: existingAttendance.id,
          employee_id: employee.id,
          date: today,
          check_in: existingAttendance.check_in,
          check_out: currentTime,
          status: existingAttendance.status,
          late_minutes: existingAttendance.late_minutes,
          auth_method: authMethod,
          created_at: existingAttendance.created_at,
          observations: existingAttendance.observations
        };
      } else {
        throw new Error(existingAttendance.check_out ? 
          'Já finalizou o expediente hoje' : 
          'Muito cedo para registrar saída');
      }

      const { data, error } = await this.supabase
        .from(this.ATTENDANCE_TABLE)
        .upsert(attendanceData)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  async getAttendanceByMonth(year: number, month: number) {
    console.log(`Buscando presenças para ${month}/${year}`);
    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const { data, error } = await this.supabase
        .from(this.ATTENDANCE_TABLE)
        .select(`
          *,
          employees (name)
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('Erro ao buscar presenças:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('Nenhuma presença encontrada para o período');
        return [];
      }

      console.log('Presenças encontradas:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar presenças:', error);
      return [];
    }
  }

  async setWorkSchedule(schedule: WorkSchedule) {
    try {
      const scheduleData = {
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        work_days: schedule.work_days,
        created_at: new Date().toISOString()
      };

      // Delete existing schedules first
      await this.supabase
        .from(this.SCHEDULE_TABLE)
        .delete()
        .neq('id', '0'); // Delete all records

      // Insert new schedule
      const { data, error } = await this.supabase
        .from(this.SCHEDULE_TABLE)
        .insert(scheduleData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar horário:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
  }

  async getWorkSchedule(): Promise<WorkSchedule> {
    try {
      const { data, error } = await this.supabase
        .from(this.SCHEDULE_TABLE)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.log('Usando configuração padrão de horário');
        return {
          start_time: '08:00',
          end_time: '16:00',
          work_days: [1, 2, 3, 4, 5]
        };
      }
      return data;
    } catch (error) {
      console.error('Erro ao buscar horário:', error);
      return {
        start_time: '08:00',
        end_time: '16:00',
        work_days: [1, 2, 3, 4, 5]
      };
    }
  }

  private calculateLateMinutes(timeIn: string, start_time: string): number {
    if (!timeIn || !start_time) {
      console.error('Invalid time parameters:', { timeIn, start_time });
      return 0;
    }

    try {
      const [inHour, inMinute] = timeIn.split(':').map(Number);
      const [startHour, startMinute] = start_time.split(':').map(Number);

      if (isNaN(inHour) || isNaN(inMinute) || isNaN(startHour) || isNaN(startMinute)) {
        console.error('Invalid time format:', { inHour, inMinute, startHour, startMinute });
        return 0;
      }

      const totalInMinutes = inHour * 60 + inMinute;
      const totalStartMinutes = startHour * 60 + startMinute;

      return Math.max(0, totalInMinutes - totalStartMinutes);
    } catch (error) {
      console.error('Error calculating late minutes:', error);
      return 0;
    }
  }

  private determineStatus(lateMinutes: number): Attendance['status'] {
    return lateMinutes > 0 ? 'Atrasado' : 'No horário';
  }

  async checkDuplicateName(name: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.EMPLOYEES_TABLE)
      .select('id')
      .ilike('name', name.trim());

    if (error) throw error;
    return (data || []).length > 0;
  }

  async updateEmployee(employee: Employee): Promise<Employee> {
    try {
      const { data, error } = await this.supabase
        .from(this.EMPLOYEES_TABLE)
        .update(employee)
        .eq('id', employee.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw error;
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.EMPLOYEES_TABLE)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      throw error;
    }
  }

  async getEmployeeHistory(id: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.ATTENDANCE_TABLE)
        .select(`
          *,
          employees (name)
        `)
        .eq('employee_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
  }
}