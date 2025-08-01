import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ScheduleData, DailyRecord, SyncQueueItem } from '../models/schedule.model';
import { Employee, Attendance, WorkSchedule } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  /**
   * Remove um funcionário do cache local pelo id
   */
  removeEmployee(id: string): void {
    const employees = this.getEmployeesSync();
    const filtered = employees.filter(emp => emp.id !== id);
    localStorage.setItem(this.EMPLOYEES_KEY, JSON.stringify(filtered));
    this.employeesSubject.next(filtered);
  }

  /**
   * Remove todas as presenças de um funcionário do cache local pelo id do funcionário
   */
  removeAttendanceByEmployeeId(employeeId: string): void {
    const attendances = this.getAttendanceSync();
    const filtered = attendances.filter(att => att.employee_id !== employeeId);
    localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(filtered));
    this.attendanceSubject.next(filtered);
  }
  private readonly SCHEDULE_KEY = 'schedule_data';
  private readonly RECORDS_KEY = 'daily_records';
  private readonly SYNC_QUEUE_KEY = 'sync_queue';
  private readonly EMPLOYEES_KEY = 'employees_cache';
  private readonly ATTENDANCE_KEY = 'attendance_cache';
  private readonly WORK_SCHEDULE_KEY = 'work_schedule_cache';
  private readonly LAST_SYNC_KEY = 'last_sync_timestamp';

  private recordsSubject = new BehaviorSubject<DailyRecord[]>([]);
  private scheduleSubject = new BehaviorSubject<ScheduleData | null>(null);
  private employeesSubject = new BehaviorSubject<Employee[]>([]);
  private attendanceSubject = new BehaviorSubject<Attendance[]>([]);
  private workScheduleSubject = new BehaviorSubject<WorkSchedule | null>(null);

  private blockSyncQueue = false;

  constructor() {
    this.loadInitialData();
  }

  // Schedule Methods
  saveSchedule(schedule: ScheduleData): void {
    schedule.updatedAt = new Date();
    schedule.synced = false;
    localStorage.setItem(this.SCHEDULE_KEY, JSON.stringify(schedule));
    this.scheduleSubject.next(schedule);
    // Removido: this.addToSyncQueue('schedule', 'update', schedule);
  }

  getSchedule(): Observable<ScheduleData | null> {
    return this.scheduleSubject.asObservable();
  }

  getScheduleSync(): ScheduleData | null {
    const data = localStorage.getItem(this.SCHEDULE_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Daily Records Methods
  saveDailyRecord(record: DailyRecord): void {
    const records = this.getDailyRecordsSync();
    record.id = record.id || this.generateId();
    record.createdAt = new Date();
    record.synced = false;

    const existingIndex = records.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      records[existingIndex] = record;
      // Removido: this.addToSyncQueue('record', 'update', record);
    } else {
      records.push(record);
      // Removido: this.addToSyncQueue('record', 'create', record);
    }

    localStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));
    this.recordsSubject.next(records);
  }

  getDailyRecords(): Observable<DailyRecord[]> {
    return this.recordsSubject.asObservable();
  }

  getDailyRecordsSync(): DailyRecord[] {
    const data = localStorage.getItem(this.RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  }

  deleteDailyRecord(recordId: string): void {
    const records = this.getDailyRecordsSync();
    const filteredRecords = records.filter(r => r.id !== recordId);
    localStorage.setItem(this.RECORDS_KEY, JSON.stringify(filteredRecords));
    this.recordsSubject.next(filteredRecords);
    // Removido: this.addToSyncQueue('record', 'delete', { id: recordId });
  }

  // Employee Methods
  saveEmployees(employees: Employee[]): void {
    const employeesWithTimestamp = employees.map(emp => ({
      ...emp,
      cached_at: new Date(),
      synced: true
    }));
    localStorage.setItem(this.EMPLOYEES_KEY, JSON.stringify(employeesWithTimestamp));
    this.employeesSubject.next(employees);
  }

  getEmployees(): Observable<Employee[]> {
    return this.employeesSubject.asObservable();
  }

  getEmployeesSync(): Employee[] {
    const data = localStorage.getItem(this.EMPLOYEES_KEY);
    return data ? JSON.parse(data) : [];
  }

  getEmployeeById(id: string): Employee | null {
    const employees = this.getEmployeesSync();
    return employees.find(emp => emp.id === id) || null;
  }

  saveEmployee(employee: Employee): void {
    const employees = this.getEmployeesSync();
    const employeeWithMeta = {
      ...employee,
      cached_at: new Date(),
      synced: false
    };

    const existingIndex = employees.findIndex(e => e.id === employee.id);
    if (existingIndex >= 0) {
      employees[existingIndex] = employeeWithMeta;
      // Removido: this.addToSyncQueue('employee', 'update', employee);
    } else {
      employees.push(employeeWithMeta);
      // Removido: this.addToSyncQueue('employee', 'create', employee);
    }

    localStorage.setItem(this.EMPLOYEES_KEY, JSON.stringify(employees));
    this.employeesSubject.next(employees);
  }

  // Attendance Methods
  saveAttendance(attendance: Attendance): void {
    const attendances = this.getAttendanceSync();
    const attendanceWithMeta = {
      ...attendance,
      cached_at: new Date(),
      synced: false
    };
    const existingIndex = attendances.findIndex(a => a.id === attendance.id);
    if (existingIndex >= 0) {
      attendances[existingIndex] = attendanceWithMeta;
      // Removido: this.addToSyncQueue('attendance', 'update', attendanceWithMeta);
    } else {
      attendances.push(attendanceWithMeta);
      // Removido: this.addToSyncQueue('attendance', 'create', attendanceWithMeta);
    }
    localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(attendances));
    this.attendanceSubject.next(attendances);
  }

  getAttendance(): Observable<Attendance[]> {
    return this.attendanceSubject.asObservable();
  }

  getAttendanceSync(): Attendance[] {
    const data = localStorage.getItem(this.ATTENDANCE_KEY);
    return data ? JSON.parse(data) : [];
  }

  getTodayAttendance(): Attendance[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getAttendanceSync().filter(att => att.date === today);
  }

  getAttendanceByDate(date: string): Attendance[] {
    return this.getAttendanceSync().filter(att => att.date === date);
  }

  getAttendanceByMonth(year: number, month: number): Attendance[] {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    return this.getAttendanceSync().filter(att =>
      att.date >= startDate && att.date <= endDate
    );
  }

  // Work Schedule Methods
  saveWorkSchedule(schedule: WorkSchedule): void {
    const scheduleWithMeta = {
      ...schedule,
      cached_at: new Date(),
      synced: false
    };
    localStorage.setItem(this.WORK_SCHEDULE_KEY, JSON.stringify(scheduleWithMeta));
    this.workScheduleSubject.next(scheduleWithMeta);
    // Removido: this.addToSyncQueue('work_schedule', 'update', schedule);
  }

  getWorkSchedule(): Observable<WorkSchedule | null> {
    return this.workScheduleSubject.asObservable();
  }

  getWorkScheduleSync(): WorkSchedule | null {
    const data = localStorage.getItem(this.WORK_SCHEDULE_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Sync timestamp methods
  setLastSyncTimestamp(): void {
    localStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
  }

  getLastSyncTimestamp(): Date | null {
    const timestamp = localStorage.getItem(this.LAST_SYNC_KEY);
    return timestamp ? new Date(timestamp) : null;
  }

  // Cache management
  shouldRefreshCache(cacheKey: string, maxAgeMinutes: number = 30): boolean {
    const data = localStorage.getItem(cacheKey);
    if (!data) return true;

    try {
      const parsed = JSON.parse(data);
      const cachedAt = parsed[0]?.cached_at;
      if (!cachedAt) return true;

      const age = (Date.now() - new Date(cachedAt).getTime()) / (1000 * 60);
      return age > maxAgeMinutes;
    } catch {
      return true;
    }
  }

  isDataStale(type: 'employees' | 'attendance' | 'work_schedule', maxAgeMinutes: number = 30): boolean {
    const keyMap = {
      employees: this.EMPLOYEES_KEY,
      attendance: this.ATTENDANCE_KEY,
      work_schedule: this.WORK_SCHEDULE_KEY
    };

    return this.shouldRefreshCache(keyMap[type], maxAgeMinutes);
  }

  // Enhanced sync queue methods
  private addToSyncQueue(type: 'schedule' | 'record' | 'employee' | 'attendance' | 'work_schedule', action: 'create' | 'update' | 'delete', data: any): void {
    if (this.blockSyncQueue) {
      // Bloqueia inserção de novos pendentes após limpeza manual
      return;
    }
    const queue = this.getSyncQueue();
    let existingIndex = -1;
    if (type === 'attendance') {
      // Deduplicar por employee_id + date
      existingIndex = queue.findIndex(
        (item: any) => item.type === 'attendance' && item.action === action &&
          item.data && item.data.employee_id === data.employee_id && item.data.date === data.date
      );
    } else {
      // Deduplicação padrão por id ou identificador principal
      const dataId = data.id || data.internal_code || data.employee_id || data.date;
      existingIndex = queue.findIndex(
        (item: any) => item.type === type && item.action === action && (
          (item.data && (item.data.id === dataId || item.data.internal_code === dataId || item.data.employee_id === dataId || item.data.date === dataId))
        )
      );
    }
    if (existingIndex >= 0) {
      // Atualiza o item existente
      queue[existingIndex].data = data;
      queue[existingIndex].timestamp = new Date();
      queue[existingIndex].retryCount = 0;
    } else {
      // Adiciona novo item
      const item: SyncQueueItem = {
        id: this.generateId(),
        type,
        action,
        data,
        timestamp: new Date(),
        retryCount: 0
      };
      queue.push(item);
    }
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  getSyncQueue(): SyncQueueItem[] {
    const data = localStorage.getItem(this.SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  removeSyncQueueItem(itemId: string): void {
    const queue = this.getSyncQueue();
    const filteredQueue = queue.filter(item => item.id !== itemId);
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(filteredQueue));
  }

  // Método para atualizar um item existente na fila de sincronização
  updateSyncQueueItem(item: SyncQueueItem): void {
    const queue = this.getSyncQueue();
    const index = queue.findIndex(qItem => qItem.id === item.id);

    if (index >= 0) {
      queue[index] = item;
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    }
  }

  clearSyncQueue(): void {
    localStorage.removeItem(this.SYNC_QUEUE_KEY);
    this.blockSyncQueue = true;
  }

  // Contagem de itens pendentes para sincronização
  getPendingSyncCount(): number {
    return this.getSyncQueue().length;
  }

  // Utility Methods
  private loadInitialData(): void {
    const schedule = this.getScheduleSync();
    const records = this.getDailyRecordsSync();
    const employees = this.getEmployeesSync();
    const attendance = this.getAttendanceSync();
    const workSchedule = this.getWorkScheduleSync();

    this.scheduleSubject.next(schedule);
    this.recordsSubject.next(records);
    this.employeesSubject.next(employees);
    this.attendanceSubject.next(attendance);
    this.workScheduleSubject.next(workSchedule);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  clearAllData(): void {
    localStorage.removeItem(this.SCHEDULE_KEY);
    localStorage.removeItem(this.RECORDS_KEY);
    localStorage.removeItem(this.SYNC_QUEUE_KEY);
    localStorage.removeItem(this.EMPLOYEES_KEY);
    localStorage.removeItem(this.ATTENDANCE_KEY);
    localStorage.removeItem(this.WORK_SCHEDULE_KEY);
    localStorage.removeItem(this.LAST_SYNC_KEY);

    this.recordsSubject.next([]);
    this.scheduleSubject.next(null);
    this.employeesSubject.next([]);
    this.attendanceSubject.next([]);
    this.workScheduleSubject.next(null);
  }

  // Statistics and reporting
  getUnsyncedItemsCount(): { [key: string]: number } {
    const queue = this.getSyncQueue();
    const counts = {
      employee: 0,
      attendance: 0,
      work_schedule: 0,
      schedule: 0,
      record: 0
    };

    queue.forEach(item => {
      if (counts.hasOwnProperty(item.type)) {
        counts[item.type]++;
      }
    });

    return counts;
  }

  getStorageUsage(): { [key: string]: number } {
    const usage = {
      employees: this.getDataSize(this.EMPLOYEES_KEY),
      attendance: this.getDataSize(this.ATTENDANCE_KEY),
      schedule: this.getDataSize(this.SCHEDULE_KEY),
      records: this.getDataSize(this.RECORDS_KEY),
      sync_queue: this.getDataSize(this.SYNC_QUEUE_KEY),
      total: 0
    };

    usage.total = Object.values(usage).reduce((sum, size) => sum + size, 0);
    return usage;
  }

  private getDataSize(key: string): number {
    const data = localStorage.getItem(key);
    return data ? new Blob([data]).size : 0;
  }

  // Data export/import for backup
  exportAllData(): string {
    const data = {
      employees: this.getEmployeesSync(),
      attendance: this.getAttendanceSync(),
      schedule: this.getScheduleSync(),
      records: this.getDailyRecordsSync(),
      workSchedule: this.getWorkScheduleSync(),
      syncQueue: this.getSyncQueue(),
      lastSync: this.getLastSyncTimestamp(),
      exportedAt: new Date()
    };

    return JSON.stringify(data);
  }

  importAllData(dataString: string): boolean {
    try {
      const data = JSON.parse(dataString);

      if (data.employees) {
        localStorage.setItem(this.EMPLOYEES_KEY, JSON.stringify(data.employees));
        this.employeesSubject.next(data.employees);
      }

      if (data.attendance) {
        localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(data.attendance));
        this.attendanceSubject.next(data.attendance);
      }

      if (data.schedule) {
        localStorage.setItem(this.SCHEDULE_KEY, JSON.stringify(data.schedule));
        this.scheduleSubject.next(data.schedule);
      }

      if (data.records) {
        localStorage.setItem(this.RECORDS_KEY, JSON.stringify(data.records));
        this.recordsSubject.next(data.records);
      }

      if (data.workSchedule) {
        localStorage.setItem(this.WORK_SCHEDULE_KEY, JSON.stringify(data.workSchedule));
        this.workScheduleSubject.next(data.workSchedule);
      }

      if (data.syncQueue) {
        localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(data.syncQueue));
      }

      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  }
}
