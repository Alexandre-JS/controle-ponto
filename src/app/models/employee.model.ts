export type WorkStatus = 'Em andamento' | 'Encerrado' | 'Não iniciado';

export type AttendanceStatus = 'Presente' | 'Atrasado' | 'Ausente';

export interface Employee {
  id: string;
  name: string;
  position: string; 
  internal_code: string;
  department: string;
  created_at: string;
  qr_code: string;
}

// For creating new employees
export interface CreateEmployeeDto {
  name: string;
  position: string;
  department: string;
  internal_code?: string;
}

export type AuthMethod = 'code' | 'face' | 'fingerprint' | 'qr'; // matches database enum

export interface Attendance {
  id?: string;
  employee_id: string;  // Changed from employeeId
  employee?: Employee; // Add this line for the relation
  date: string;
  check_in?: string;    // Changed from timeIn
  check_out?: string;
  late_minutes?: number;
  status: AttendanceStatus;  // Update to use standardized status
  observations?: string;
  auth_method?: string;
  created_at?: string;
  // updated_at?: string;
}

export interface WorkSchedule {
  id?: string;
  start_time: string;  // Changed from startTime
  end_time: string;    // Changed from endTime
  work_days: number[];
  created_at?: string;
}