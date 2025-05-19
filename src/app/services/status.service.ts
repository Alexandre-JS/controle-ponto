import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AttendanceStatus } from '../models/employee.model';

export type WorkStatus = 'Em andamento' | 'Encerrado' | 'Não iniciado';

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private workStatus = new BehaviorSubject<WorkStatus>('Não iniciado');

  getStatusColor(status: AttendanceStatus | WorkStatus): string {
    switch (status) {
      case 'Presente':
        return 'success';
      case 'Ausente':
        return 'danger';
      default:
        return 'medium';
    }
  }

  determineAttendanceStatus(checkIn: string | null, checkOut: string | null, scheduleStart: string): AttendanceStatus {
    if (!checkIn) {
      return 'Ausente';
    }
    return 'Presente';
  }

  getEmployeeCurrentStatus(checkIn: string | null, checkOut: string | null): AttendanceStatus {
    return checkIn ? 'Presente' : 'Ausente';
  }

  getInitialStatus(): AttendanceStatus {
    return 'Ausente';
  }

  determineWorkStatus(currentTime: Date, startTime: string, endTime: string): WorkStatus {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (currentMinutes < startMinutes) return 'Não iniciado';
    if (currentMinutes > endMinutes) return 'Encerrado';
    return 'Em andamento';
  }

  updateWorkStatus(status: WorkStatus) {
    this.workStatus.next(status);
  }

  getWorkStatus() {
    return this.workStatus.asObservable();
  }
}
