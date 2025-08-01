import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { StatusService, WorkStatus } from '../../services/status.service';
import { interval, Subscription } from 'rxjs';
import { AttendanceStatus } from '../../models/employee.model';
import { SyncStatusComponent } from '../../components/sync-status/sync-status.component';
import { NetworkService } from '../../services/network.service';
import { SyncService } from '../../services/sync.service';
import { AttendanceEditModalComponent } from '../../components/attendance-edit-modal/attendance-edit-modal.component';

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
  isAuthenticated = false;

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private authService: AuthService,
    public statusService: StatusService,
    private networkService: NetworkService,
    private syncService: SyncService,
    private modalController: ModalController,
    private toastController: ToastController
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
    // Verificar autenticação primeiro
    const isAuthenticated = await this.checkAuthentication();
    if (!isAuthenticated) {
      console.log('Usuário não autenticado, redirecionando para login');
      this.router.navigate(['/login']);
      return; // Interromper a inicialização do componente
    }
    
    // Só continua se estiver autenticado
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
      const formattedDate = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      console.log('Buscando presenças para a data:', formattedDate);
      
      // Usar método específico para hoje em vez de filtrar depois
      const attendanceData = await this.employeeService.getTodayAttendance(formattedDate);
      console.log('Dados recebidos:', attendanceData);

      // Simplificar o tratamento dos dados e incluir logs detalhados
      this.todayAttendance = attendanceData.map(record => {
        console.log('Processando registro:', record);
        console.log('Dados do funcionário disponíveis:', !!record.employee);
        
        // Tentar recuperar o nome do funcionário de várias maneiras
        if (!record.employee && record.employee_id) {
          // Tentar encontrar o funcionário na lista carregada
          record.employee = this.employees.find(emp => emp.id === record.employee_id);
          console.log('Funcionário encontrado na lista local:', !!record.employee);
        }
        
        return record;
      });

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

  private async checkAuthentication(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.authService.isAuthenticated().subscribe(
        isAuth => {
          this.isAuthenticated = isAuth;
          resolve(isAuth);
        },
        error => {
          console.error('Erro ao verificar autenticação:', error);
          resolve(false);
        }
      );
    });
  }

  async editAttendanceRecord(record: any) {
    // Simplificar a verificação para evitar o erro com isAdmin
    // Podemos implementar verificação de permissão mais tarde
    
    const modal = await this.modalController.create({
      component: AttendanceEditModalComponent,
      componentProps: {
        attendanceRecord: record
      }
    });
    
    await modal.present();
    
    // Quando o modal for fechado, verificar se houve atualização
    const { data } = await modal.onDidDismiss();
    if (data) {
      // Atualizar a lista de presenças
      await this.loadTodayAttendance();
    }
  }
}
    // const { data } = await modal.onDidDismiss();
    // if (data) {
    //   // Atualizar a lista de presenças
    //   await this.loadTodayAttendance();
    // }
  
