import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Employee, Attendance, WorkSchedule, CreateEmployeeDto, AttendanceStatus } from '../models/employee.model';
import { environment } from '../../environments/environment';
import { SupabaseService } from './supabase.service';
import { StatusService } from './status.service';

export type AuthMethod = 'code' | 'face' | 'fingerprint' | 'qr';

export interface QRCodeData {
  internal_code: string;
  timestamp: number;
}

export interface Department {
  id: number;
  name: string;
}

export interface AttendanceRecord {
  employee_id: string;
  date: string;
  check_in: string;
  check_out: string;
  late_minutes: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly EMPLOYEES_TABLE = 'employees';
  private readonly ATTENDANCE_TABLE = 'attendance';
  private readonly SCHEDULE_TABLE = 'work_schedule';
  private supabase: SupabaseClient;

  constructor(
    private supabaseService: SupabaseService,
    private statusService: StatusService
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  // Novo método unificado para geração de códigos únicos
  private async generateUniqueInternalCode(): Promise<string> {
    let isUnique = false;
    let internal_code = '';

    // Tentar até encontrar um código único
    while (!isUnique) {
      // Gerar um código aleatório
      const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      internal_code = `AEM${randomNumber}`;

      // Verificar se já existe no banco de dados
      const { data } = await this.supabase
        .from(this.EMPLOYEES_TABLE)
        .select('id')
        .eq('internal_code', internal_code);

      // Se não encontrou nenhum registro com este código, é único
      isUnique = !data || data.length === 0;
    }

    return internal_code;
  }

  private generateQRCodeData(employee: Partial<Employee>): string {
    // Retornar apenas o código interno do funcionário
    return employee.internal_code!;
  }

  async createEmployee(employeeData: CreateEmployeeDto) {
    try {
      const internal_code = await this.generateUniqueInternalCode();

      const { data, error } = await this.supabase
        .from('employees')
        .insert([{
          ...employeeData,
          internal_code,
          qr_code: internal_code // Usar o código interno diretamente como QR code
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating employee:', error);
        throw error;
      }

      console.log('Employee created:', data);
      return data;
    } catch (error) {
      console.error('Create employee error:', error);
      throw error;
    }
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
    try {
      console.log('Fetching employees...');
      
      const { data, error } = await this.supabase
        .from(this.EMPLOYEES_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data) {
        console.log('No data returned');
        return [];
      }

      console.log('Fetched employees:', data);
      return data;
    } catch (error) {
      console.error('Error in getEmployees:', error);
      throw error;
    }
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

 async registerAttendance(employeeCode: string, method: AuthMethod): Promise<void> {
  try {
    const employee = await this.findEmployeeByCode(employeeCode);
    if (!employee) throw new Error('Funcionário não encontrado');

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('pt-BR', { hour12: false }).substring(0, 5);
    
    // Obter o schedule aqui
    const schedule = await this.getWorkSchedule();

    // Check existing attendance
    const { data: existingRecord } = await this.supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today)
      .single();

    if (!existingRecord) {
      // Create new record
      const { error } = await this.supabase
        .from('attendance')
        .insert({
          employee_id: employee.id,
          date: today,
          check_in: currentTime,
          late_minutes: this.calculateLateMinutes(currentTime, schedule.start_time), // Aqui usa os dois argumentos
          status: 'Presente',
          auth_method: method,
          created_at: now.toISOString(),
        
        });

      if (error) throw error;
    } else if (!existingRecord.check_out) {
      // Update with check-out
      const { error } = await this.supabase
        .from('attendance')
        .update({
          check_out: currentTime,
          // updated_at: now.toISOString()
        })
        .eq('id', existingRecord.id);

      if (error) throw error;
    } else {
      throw new Error('Registro de ponto já finalizado para hoje');
    }
  } catch (error) {
    console.error('Erro no registro:', error);
    throw error;
  }
}

  // private async calculateLateMinutes(checkInTime: string): Promise<number> {
  //   const schedule = await this.getWorkSchedule();
  //   const [checkInHour, checkInMin] = checkInTime.split(':').map(Number);
  //   const [startHour, startMin] = schedule.start_time.split(':').map(Number);
    
  //   const checkInMinutes = checkInHour * 60 + checkInMin;
  //   const startMinutes = startHour * 60 + startMin;
    
  //   return Math.max(0, checkInMinutes - startMinutes);
  // }

  async registerAttendanceByQRCode(qrData: string) {
    try {
      console.log('Processando QR code:', qrData);
      
      // Validate QR code format
      if (!qrData.match(/^AEM\d{3}$/)) {
        throw new Error('Código QR inválido. Use o código fornecido pelo sistema.');
      }

      const employee = await this.findEmployeeByCode(qrData);
      if (!employee) {
        throw new Error(`Funcionário não encontrado com o código ${qrData}`);
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().substring(0, 5);

      // Verificar registros existentes
      const { data: existingAttendances } = await this.supabase
        .from(this.ATTENDANCE_TABLE)
        .select('*')
        .eq('employee_id', employee.id)
        .eq('date', today)
        .order('created_at', { ascending: false });

      const lastRecord = existingAttendances?.[0];

      // Melhorar mensagens de feedback
      if (!lastRecord) {
        const result = await this.registerCheckIn(employee, today, currentTime, 'qr');
        await this.updateEmployeeStatus(employee.id, 'Presente');
        return {
          success: true,
          message: `Bom dia ${employee.name}! Entrada registrada com sucesso às ${currentTime}.`,
          data: result
        };
      } else if (!lastRecord.check_out && now.getHours() >= 12) {
        const result = await this.registerCheckOut(lastRecord, currentTime, 'qr');
        await this.updateEmployeeStatus(employee.id, 'Ausente');
        return {
          success: true,
          message: `Até amanhã ${employee.name}! Saída registrada com sucesso às ${currentTime}.`,
          data: result
        };
      } else if (lastRecord.check_out) {
        throw new Error(`${employee.name}, você já finalizou seu expediente hoje.`);
      } else {
        throw new Error(`${employee.name}, ainda é muito cedo para registrar saída.`);
      }
    } catch (error: any) {
      console.error('Erro no registro por QR code:', error);
      throw new Error(error.message || 'Erro ao processar registro de ponto');
    }
  }

  async updateEmployeeStatus(employeeId: string, status: AttendanceStatus) {
    try {
      const { data, error } = await this.supabase
        .from(this.EMPLOYEES_TABLE)
        .update({ status }) // Simplify to only update status
        .eq('id', employeeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating employee status:', error);
      throw error;
    }
  }

  private determineStatus(lateMinutes: number): AttendanceStatus {
    return lateMinutes > 0 ? 'Atrasado' : 'Presente';
  }

  private async registerCheckIn(employee: Employee, date: string, time: string, authMethod: AuthMethod) {
    const workSchedule = await this.getWorkSchedule();
    const lateMinutes = this.calculateLateMinutes(time, workSchedule.start_time);
    
    console.log('Registrando entrada:', { employee, authMethod });
    
    const attendanceData = {
      employee_id: employee.id,
      date: date,
      check_in: time,
      status: lateMinutes > 0 ? 'Atrasado' : 'Presente',
      late_minutes: lateMinutes,
      auth_method: authMethod,
      created_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from(this.ATTENDANCE_TABLE)
      .insert([attendanceData])
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
        // updated_at: new Date().toISOString()
      })
      .eq('id', record.id)
      .select();

    if (error) throw error;

    await this.updateEmployeeStatus(record.employee_id, 'Ausente');

    return data[0];
  }

  async getAttendanceByMonth(year: number, month: number) {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const { data, error } = await this.supabase
        .from(this.ATTENDANCE_TABLE)
        .select(`
          *,
          employee:employees (
            id,
            name,
            internal_code
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;
      return data || [];
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

  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.ATTENDANCE_TABLE)
        .select(`
          *,
          employee:employees (
            id,
            name,
            internal_code
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar presenças:', error);
      return [];
    }
  }

  async getDepartments(): Promise<Department[]> {
    try {
      const { data, error } = await this.supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      return [];
    }
  }
}