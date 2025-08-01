import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { LocalStorageService } from './local-storage.service';
import { NetworkService } from './network.service';
import { SyncService } from './sync.service';
import { EmployeeService } from './employee.service';
import { Employee, Attendance, WorkSchedule } from '../models/employee.model';

export interface CacheStrategy {
  maxAge: number; // minutes
  forceRefresh: boolean;
  offlineFirst: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly DEFAULT_CACHE_STRATEGY: CacheStrategy = {
    maxAge: 30,
    forceRefresh: false,
    offlineFirst: false
  };

  constructor(
    private localStorageService: LocalStorageService,
    private networkService: NetworkService,
    private syncService: SyncService,
    private employeeService: EmployeeService
  ) {}

  // Cache inteligente para funcionários
  getEmployees(strategy: Partial<CacheStrategy> = {}): Observable<Employee[]> {
    const config = { ...this.DEFAULT_CACHE_STRATEGY, ...strategy };
    
    // Se offline, sempre usar cache
    if (!this.networkService.isOnline()) {
      return this.localStorageService.getEmployees();
    }

    // Se forceRefresh ou cache expirado, buscar do servidor
    if (config.forceRefresh || this.localStorageService.isDataStale('employees', config.maxAge)) {
      return this.fetchEmployeesFromServer().pipe(
        catchError(error => {
          console.warn('Falha ao buscar funcionários do servidor, usando cache:', error);
          return this.localStorageService.getEmployees();
        })
      );
    }

    // Usar cache local
    return this.localStorageService.getEmployees();
  }

  // Cache inteligente para presença
  getAttendance(strategy: Partial<CacheStrategy> = {}): Observable<Attendance[]> {
    const config = { ...this.DEFAULT_CACHE_STRATEGY, ...strategy };
    
    if (!this.networkService.isOnline()) {
      return this.localStorageService.getAttendance();
    }

    if (config.forceRefresh || this.localStorageService.isDataStale('attendance', config.maxAge)) {
      return this.fetchAttendanceFromServer().pipe(
        catchError(error => {
          console.warn('Falha ao buscar presenças do servidor, usando cache:', error);
          return this.localStorageService.getAttendance();
        })
      );
    }

    return this.localStorageService.getAttendance();
  }

  // Cache para horário de trabalho
  getWorkSchedule(strategy: Partial<CacheStrategy> = {}): Observable<WorkSchedule | null> {
    const config = { ...this.DEFAULT_CACHE_STRATEGY, ...strategy };
    
    if (!this.networkService.isOnline()) {
      return this.localStorageService.getWorkSchedule();
    }

    if (config.forceRefresh || this.localStorageService.isDataStale('work_schedule', config.maxAge)) {
      return this.fetchWorkScheduleFromServer().pipe(
        catchError(error => {
          console.warn('Falha ao buscar horário do servidor, usando cache:', error);
          return this.localStorageService.getWorkSchedule();
        })
      );
    }

    return this.localStorageService.getWorkSchedule();
  }

  // Métodos para buscar dados do servidor
  private fetchEmployeesFromServer(): Observable<Employee[]> {
    return new Observable(observer => {
      this.employeeService.getEmployees().then(employees => {
        this.localStorageService.saveEmployees(employees);
        observer.next(employees);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  private fetchAttendanceFromServer(): Observable<Attendance[]> {
    return new Observable(observer => {
      // Buscar presenças dos últimos 30 dias
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      this.employeeService.getAttendanceByMonth(
        startDate.getFullYear(), 
        startDate.getMonth() + 1
      ).then(attendance => {
        // Salvar individualmente para manter sincronização
        attendance.forEach(att => {
          this.localStorageService.saveAttendance({
            ...att,
            synced: true
          });
        });
        observer.next(attendance);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  private fetchWorkScheduleFromServer(): Observable<WorkSchedule | null> {
    return new Observable(observer => {
      this.employeeService.getWorkSchedule().then(schedule => {
        if (schedule) {
          this.localStorageService.saveWorkSchedule({
            ...schedule,
            synced: true
          });
        }
        observer.next(schedule);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  // Métodos de conveniência para diferentes cenários
  
  // Para páginas que precisam de dados sempre atualizados
  getEmployeesAlwaysFresh(): Observable<Employee[]> {
    return this.getEmployees({ forceRefresh: true, maxAge: 0 });
  }

  // Para páginas que podem usar cache por mais tempo
  getEmployeesCached(): Observable<Employee[]> {
    return this.getEmployees({ maxAge: 120 }); // 2 horas
  }

  // Para operações offline-first
  getEmployeesOfflineFirst(): Observable<Employee[]> {
    return this.getEmployees({ offlineFirst: true, maxAge: 60 });
  }

  // Presença do dia atual (sempre atualizada)
  getTodayAttendance(): Observable<Attendance[]> {
    const today = new Date().toISOString().split('T')[0];
    
    return this.getAttendance({ forceRefresh: true, maxAge: 5 }).pipe(
      switchMap(attendance => {
        const todayAttendance = attendance.filter(att => att.date === today);
        return of(todayAttendance);
      })
    );
  }

  // Invalidar cache específico
  invalidateCache(type: 'employees' | 'attendance' | 'work_schedule'): void {
    switch (type) {
      case 'employees':
        // Marcar cache como expirado forçando busca do servidor
        this.getEmployees({ forceRefresh: true }).subscribe();
        break;
      case 'attendance':
        this.getAttendance({ forceRefresh: true }).subscribe();
        break;
      case 'work_schedule':
        this.getWorkSchedule({ forceRefresh: true }).subscribe();
        break;
    }
  }

  // Invalidar todo o cache
  invalidateAllCache(): void {
    this.invalidateCache('employees');
    this.invalidateCache('attendance');
    this.invalidateCache('work_schedule');
  }

  // Pré-carregar dados importantes
  async preloadEssentialData(): Promise<void> {
    try {
      // Carregar dados essenciais em paralelo
      await Promise.all([
        this.getEmployees({ maxAge: 30 }).toPromise(),
        this.getWorkSchedule({ maxAge: 60 }).toPromise(),
        this.getTodayAttendance().toPromise()
      ]);
      
      console.log('Dados essenciais pré-carregados');
    } catch (error) {
      console.warn('Falha no pré-carregamento:', error);
    }
  }

  // Status do cache
  getCacheStatus(): {
    employees: { stale: boolean; lastUpdate: Date | null };
    attendance: { stale: boolean; lastUpdate: Date | null };
    workSchedule: { stale: boolean; lastUpdate: Date | null };
    syncPending: number;
    isOnline: boolean;
  } {
    return {
      employees: {
        stale: this.localStorageService.isDataStale('employees'),
        lastUpdate: this.getLastCacheUpdate('employees')
      },
      attendance: {
        stale: this.localStorageService.isDataStale('attendance'),
        lastUpdate: this.getLastCacheUpdate('attendance')
      },
      workSchedule: {
        stale: this.localStorageService.isDataStale('work_schedule'),
        lastUpdate: this.getLastCacheUpdate('work_schedule')
      },
      syncPending: this.syncService.getPendingSyncCount(),
      isOnline: this.networkService.isOnline()
    };
  }

  private getLastCacheUpdate(type: string): Date | null {
    // Implementar lógica para obter timestamp do último cache update
    return this.localStorageService.getLastSyncTimestamp();
  }
}
