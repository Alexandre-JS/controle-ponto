import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Employee, Attendance, WorkSchedule, CreateEmployeeDto } from '../models/employee.model';
import { environment } from '../../environments/environment';

export type AuthMethod = 'code' | 'face' | 'fingerprint' | 'qr';

export interface QRCodeData {
  internal_code: string;
  timestamp: number;
}

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

  private generateQRCodeData(employee: Partial<Employee>): string {
    // Retornar apenas o código interno do funcionário
    return employee.internal_code!;
  }

  async createEmployee(employeeData: CreateEmployeeDto) {
    const internal_code = await this.generateInternalCode();
    
    const { data, error } = await this.supabase
      .from('employees')
      .insert([{ 
        ...employeeData,
        internal_code,
        qr_code: internal_code // Usar o código interno diretamente como QR code
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async generateInternalCode(): Promise<string> {
    const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `AEM${randomNumber}`;
  }

  async findByQRCode(qrCode: string) {
    const { data, error } = await this.supabase
      .from('employees')
      .select('*')
      .eq('qr_code', qrCode)
      .single();
      
    if (error) throw error;
    return data;
  }

  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await this.supabase
      .from(this.EMPLOYEES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findEmployeeByCode(code: string): Promise<Employee | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.EMPLOYEES_TABLE)
        .select('*')
        .eq('internal_code', code.toUpperCase())
        .single();

      if (error) {
        console.error('Erro na busca:', error);
        return null;
      }

      if (!data) {
        console.log('Nenhum funcionário encontrado com o código:', code);
        return null;
      }

      return data as Employee;
    } catch (error) {
      console.error('Erro ao buscar funcionário:', error);
      return null;
    }
  }

  async registerAttendance(employeeCode: string, authMethod: AuthMethod) {
    try {
      const employee = await this.findEmployeeByCode(employeeCode);
      if (!employee) {
        throw new Error('Funcionário não encontrado');
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().substring(0, 5);

      // Buscar registros do dia
      const { data: existingAttendances } = await this.supabase
        .from(this.ATTENDANCE_TABLE)
        .select('*')
        .eq('employee_id', employee.id)
        .eq('date', today)
        .order('created_at', { ascending: false });

      const lastRecord = existingAttendances?.[0];

      // Lógica de entrada/saída
      if (!lastRecord) {
        // Primeira entrada do dia
        return await this.registerCheckIn(employee, today, currentTime, authMethod);
      } else if (!lastRecord.check_out && now.getHours() >= 12) {
        // Saída após 12h
        return await this.registerCheckOut(lastRecord, currentTime, authMethod);
      } else if (lastRecord.check_out) {
        throw new Error('Já finalizou o expediente hoje');
      } else {
        throw new Error('Muito cedo para registrar saída');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  async registerAttendanceByQRCode(qrData: string) {
    try {
      console.log('Processando QR code:', qrData);
      
      // Validate QR code format
      if (!qrData.match(/^AEM\d{3}$/)) {
        throw new Error('QR Code inválido');
      }

      const employee = await this.findEmployeeByCode(qrData);
      if (!employee) {
        throw new Error('Funcionário não encontrado');
      }

      // Get current date/time
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().substring(0, 5);

      // Check existing attendance
      const { data: existingAttendances, error: fetchError } = await this.supabase
        .from(this.ATTENDANCE_TABLE)
        .select('*')
        .eq('employee_id', employee.id)
        .eq('date', today)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Erro ao buscar registros:', fetchError);
        throw new Error('Erro ao verificar registros existentes');
      }

      const lastRecord = existingAttendances?.[0];

      // Handle check-in/check-out
      if (!lastRecord) {
        // First entry of the day
        const attendanceData = {
          employee_id: employee.id,
          date: today,
          check_in: currentTime,
          status: 'No horário',
          late_minutes: 0,
          auth_method: 'qr' as AuthMethod,
          created_at: now.toISOString()
        };

        const { data, error } = await this.supabase
          .from(this.ATTENDANCE_TABLE)
          .insert([attendanceData])
          .select()
          .single();

        if (error) {
          console.error('Erro na inserção:', error);
          throw new Error('Erro ao registrar entrada');
        }

        return data;
      } else if (!lastRecord.check_out && now.getHours() >= 12) {
        // Check-out after 12h
        const { data, error } = await this.supabase
          .from(this.ATTENDANCE_TABLE)
          .update({
            check_out: currentTime,
            auth_method: 'qr',
            updated_at: now.toISOString()
          })
          .eq('id', lastRecord.id)
          .select()
          .single();

        if (error) {
          console.error('Erro na atualização:', error);
          throw new Error('Erro ao registrar saída');
        }

        return data;
      } else if (lastRecord.check_out) {
        throw new Error('Já finalizou o expediente hoje');
      } else {
        throw new Error('Muito cedo para registrar saída');
      }
    } catch (error) {
      console.error('Erro no registro por QR code:', error);
      throw error;
    }
  }

  private async registerCheckIn(employee: Employee, date: string, time: string, authMethod: AuthMethod) {
    const workSchedule = await this.getWorkSchedule();
    const lateMinutes = this.calculateLateMinutes(time, workSchedule.start_time);
    
    console.log('Registrando entrada:', { employee, authMethod });
    
    const attendanceData = {
      employee_id: employee.id,
      date: date,
      check_in: time,
      status: lateMinutes > 0 ? 'Atrasado' : 'No horário',
      late_minutes: lateMinutes,
      auth_method: authMethod, // This will now be properly typed
      created_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from(this.ATTENDANCE_TABLE)
      .insert(attendanceData)
      .select();

    if (error) {
      console.error('Erro ao registrar entrada:', error);
      throw new Error('Erro ao registrar entrada');
    }
    
    return data[0];
  }

  private async registerCheckOut(record: any, time: string, authMethod: AuthMethod) {
    const { data, error } = await this.supabase
      .from(this.ATTENDANCE_TABLE)
      .update({
        check_out: time,
        auth_method: authMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', record.id)
      .select();

    if (error) throw error;
    return data[0];
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