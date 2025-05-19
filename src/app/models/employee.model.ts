export type WorkStatus = 'Em andamento' | 'Encerrado' | 'Não iniciado';

export type AttendanceStatus = 'Presente' | 'Ausente';

export interface Employee {
  id: string;
  name: string;
  internal_code: string;
  department: string;
  position: string;
  created_at: string;
  qr_code: string;
  status?: AttendanceStatus;
  last_attendance_date?: string;
  last_attendance_status?: AttendanceStatus;
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
  date: Date;
  check_in: string;    // Changed from timeIn
  check_out?: string;
  status: AttendanceStatus;  // Update to use standardized status
  late_minutes?: number;
  observations?: string;
  auth_method: AuthMethod;
  created_at?: Date;
  updated_at?: Date;
}

export interface WorkSchedule {
  id?: string;
  start_time: string;  // Changed from startTime
  end_time: string;    // Changed from endTime
  work_days: number[];
  created_at?: string;
}