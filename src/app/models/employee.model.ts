export interface Employee {
  id?: string;  // Optional for creation, required after saved
  name: string;
  position: string;
  department: string;
  internal_code: string;
  created_at?: string;
}

// For creating new employees
export type CreateEmployeeDto = Omit<Employee, 'id' | 'internal_code'>;

export interface Attendance {
  id?: string;
  employee_id: string;  // Changed from employeeId
  date: Date;
  check_in: string;    // Changed from timeIn
  check_out?: string;
  status: 'Entrada' | 'Em exercício' | 'Saída' | 'Atrasado' | 'No horário' | 'Ausente' | 'Justificado';
  late_minutes?: number;
  observations?: string;
  auth_method?: 'code' | 'face' | 'fingerprint';
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