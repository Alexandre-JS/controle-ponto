import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { StatusService, WorkStatus } from '../../services/status.service';
import { interval, Subscription } from 'rxjs';
import { AttendanceStatus } from '../../models/employee.model';
import { SyncStatusComponent } from '../../components/sync-status/sync-status.component';
import { NetworkService } from '../../services/network.service';
import { SyncService } from '../../services/sync.service';

@Component({
  selector: 'app-daily-attendance',
  templateUrl: './daily-attendance.page.html',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, SyncStatusComponent]
})
export class DailyAttendancePageComponent implements OnInit, OnDestroy {
  currentTime = new Date();
  workStatus = '';
  todayAttendance: any[] = [];
  isLoading = false;
  timeSubscription?: Subscription;
  userEmail: string = '';
  totalPresent = 0;
  totalLate = 0;
  totalAbsent = 0;
  employees: any[] = [];
  isOnline = true;
  isOfflineMode = false;
  pendingSyncCount = 0;
  totalJustified = 0;
  lastUpdate: Date = new Date();

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private authService: AuthService,
    public statusService: StatusService,
    private networkService: NetworkService,
    private syncService: SyncService
  ) {
    this.updateWorkStatus();
    // Monitorar estado da rede
    this.networkService.isOnline$.subscribe(isOnline => {
      this.isOnline = isOnline;
      this.isOfflineMode = !isOnline;
    });
    // Monitorar pendências de sincronização
    this.syncService.syncStats$.subscribe(stats => {
      this.pendingSyncCount = stats.pendingItems;
    });
  }

  async ngOnInit() {
    this.startClock();
    await this.loadEmployees();
    await this.loadTodayAttendance();
    await this.loadUserProfile();
    this.lastUpdate = new Date();
  }

  ngOnDestroy() {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
  }

  private startClock() {
    this.timeSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
      this.updateWorkStatus();
    });
  }

  private async updateWorkStatus() {
    const schedule = await this.employeeService.getWorkSchedule();
    const status = this.statusService.determineWorkStatus(
      this.currentTime,
      schedule.start_time,
      schedule.end_time
    );
    this.workStatus = status;
    this.statusService.updateWorkStatus(status);
  }

  private async loadEmployees() {
    try {
      this.employees = await this.employeeService.getEmployees();
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  }

  getStatusColor(status: AttendanceStatus | WorkStatus): string {
    return this.statusService.getStatusColor(status);
  }
  
  private async calculateStatistics() {
    try {
      // Atualizar status de cada registro
      this.todayAttendance = this.todayAttendance.map(record => ({
        ...record,
        status: record.check_in ? 'Presente' : 'Ausente'
      }));

      // Calcular totais baseados no status simplificado
      this.totalPresent = this.todayAttendance.filter(a => a.status === 'Presente').length;
      this.totalAbsent = this.employees.length - this.totalPresent;
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  }

  async loadTodayAttendance() {
    try {
      const today = new Date();
      const attendanceData = await this.employeeService.getAttendanceByMonth(
        today.getFullYear(),
        today.getMonth() + 1
      );

      // Filtrar apenas funcionários que marcaram presença (têm check_in no dia atual)
      this.todayAttendance = attendanceData
        .filter(record =>
          new Date(record.date).toDateString() === today.toDateString() &&
          !!record.check_in // Apenas quem marcou presença
        )
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(record => ({
          ...record,
          employee: this.employees.find(emp => emp.id === record.employee_id)
        }));

      await this.calculateStatistics();
    } catch (error) {
      console.error('Erro ao carregar presenças:', error);
    }
  }

  private async loadUserProfile() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.userEmail = user.email || 'Administrador';
    }
  }

  getGreeting(): string {
    const hour = this.currentTime.getHours();
    const greeting = hour < 12 ? 'Bom dia' : 
                    hour < 18 ? 'Boa tarde' : 
                    'Boa noite';
    return `${greeting} ${this.userEmail}`;
  }

  async goToAttendanceControl() {
    await this.router.navigate(['/admin/attendance']);
  }

  async goToKiosk() {
    await this.router.navigate(['/kiosk']);
  }

  getStatusLabel(status: AttendanceStatus): string {
    return status; // No need for switch since we only have two states
  }

  async syncData(showToast = true) {
    try {
      await this.syncService.forcSync();
      if (showToast) {
        // Opcional: mostrar toast de sucesso
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  }

  async refreshData(event: any) {
    await this.loadEmployees();
    await this.loadTodayAttendance();
    if (event && event.target) event.target.complete();
    this.lastUpdate = new Date();
  }

  async onManualUpdate() {
    await this.loadEmployees();
    await this.loadTodayAttendance();
    this.lastUpdate = new Date();
  }

  clearAllPendingSync() {
    this.syncService['localStorageService'].clearSyncQueue();
    this.syncService['updateSyncStats']?.();
    this.pendingSyncCount = 0;
  }

  getLastUpdateTime(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.lastUpdate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    return this.lastUpdate.toLocaleTimeString();
  }
}
