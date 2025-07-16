import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { StatusService, WorkStatus } from '../../services/status.service';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { interval, forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AttendanceStatus, Employee, Attendance, WorkSchedule } from '../../models/employee.model';
import { CacheService, CacheStrategy } from '../../services/cache.service';
import { NetworkService } from '../../services/network.service';
import { SyncService } from '../../services/sync.service';
import { LocalStorageService } from '../../services/local-storage.service';

@Component({
  selector: 'app-daily-attendance',
  templateUrl: './daily-attendance.page.html',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, ThemeToggleComponent, AppHeaderComponent]
})
export class DailyAttendancePageComponent implements OnInit, OnDestroy {
  currentTime = new Date();
  workStatus = '';
  todayAttendance: Attendance[] = [];
  isLoading = false;
  timeSubscription?: Subscription;
  dataSubscriptions: Subscription[] = [];
  userEmail: string = '';
  totalPresent = 0;
  totalLate = 0;
  totalAbsent = 0;
  totalJustified = 0;
  employees: Employee[] = [];
  lastUpdate: Date = new Date();
  isOnline = true;
  pendingSyncCount = 0;
  workSchedule: WorkSchedule | null = null;

  // Cache strategy para dados do dashboard
  private dashboardCacheStrategy: CacheStrategy = {
    maxAge: 5, // 5 minutos
    forceRefresh: false,
    offlineFirst: true
  };

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private authService: AuthService,
    public statusService: StatusService,
    private cacheService: CacheService,
    private networkService: NetworkService,
    private syncService: SyncService,
    private localStorageService: LocalStorageService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.updateWorkStatus();
  }

  async ngOnInit() {
    this.startClock();
    this.setupSubscriptions();
    await this.loadAllData();
    await this.loadUserProfile();
  }

  ngOnDestroy() {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }

    this.dataSubscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSubscriptions() {
    // Monitorar estado da rede
    this.dataSubscriptions.push(
      this.networkService.isOnline$.subscribe(isOnline => {
        const wasOffline = !this.isOnline && isOnline;
        this.isOnline = isOnline;

        // Se voltar a ficar online, recarregar dados
        if (wasOffline) {
          this.showToast('Conexão restaurada. Atualizando dados...', 'success');
          this.loadAllData(true);
        }
      })
    );

    // Monitorar itens pendentes de sincronização
    this.dataSubscriptions.push(
      this.syncService.syncStats$.subscribe(stats => {
        this.pendingSyncCount = stats.pendingItems;
      })
    );
  }

  private startClock() {
    this.timeSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
      this.updateWorkStatus();
    });
  }

  private async updateWorkStatus() {
    if (!this.workSchedule) {
      this.workSchedule = await this.getWorkSchedule();
    }

    if (this.workSchedule) {
      const status = this.statusService.determineWorkStatus(
        this.currentTime,
        this.workSchedule.start_time,
        this.workSchedule.end_time
      );
      this.workStatus = status;
      this.statusService.updateWorkStatus(status);
    }
  }

  private async getWorkSchedule(): Promise<WorkSchedule | null> {
    try {
      const schedule = await this.cacheService.getWorkSchedule({
        maxAge: 60, // 1 hora
        offlineFirst: true
      }).toPromise();

      return schedule || null;
    } catch (error) {
      console.error('Erro ao obter horário de trabalho:', error);
      return this.localStorageService.getWorkScheduleSync();
    }
  }

  async loadAllData(showLoading = false) {
    let loader: any;

    if (showLoading) {
      loader = await this.loadingController.create({
        message: 'Carregando dados...',
        spinner: 'circles',
        duration: 10000 // limite máximo de 10 segundos
      });
      await loader.present();
    }

    // Criar um timeout para garantir que o loading será fechado
    const loadingTimeout = setTimeout(() => {
      if (loader) {
        loader.dismiss();
        this.showToast('Tempo limite excedido ao carregar dados. Usando dados em cache.', 'warning');
      }
    }, 12000);

    try {
      this.isLoading = true;

      // Usar timeout para forçar conclusão do carregamento
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout loading data')), 8000);
      });

      // Carregar dados em paralelo para melhor performance
      const dataPromise = forkJoin({
        employees: this.cacheService.getEmployees(this.dashboardCacheStrategy).pipe(
          catchError(err => {
            console.error('Erro ao carregar funcionários:', err);
            return of(this.localStorageService.getEmployeesSync());
          })
        ),
        attendance: this.cacheService.getTodayAttendance().pipe(
          catchError(err => {
            console.error('Erro ao carregar presenças:', err);
            return of(this.localStorageService.getAttendanceSync().filter(a =>
              new Date(a.date).toDateString() === new Date().toDateString()
            ));
          })
        ),
        workSchedule: this.getWorkSchedule()
      });

      // Usar Promise.race para limitar o tempo de carregamento
      const result = await Promise.race([dataPromise, timeoutPromise])
        .catch(error => {
          console.warn('Timeout ou erro ao carregar dados:', error);
          return {
            employees: this.localStorageService.getEmployeesSync(),
            attendance: this.localStorageService.getAttendanceSync().filter(a =>
              new Date(a.date).toDateString() === new Date().toDateString()
            ),
            workSchedule: this.localStorageService.getWorkScheduleSync()
          };
        }) as {
          employees: Employee[],
          attendance: Attendance[],
          workSchedule: WorkSchedule | null
        };

      // Processar os resultados
      this.employees = result.employees || [];
      this.todayAttendance = result.attendance || [];
      this.workSchedule = result.workSchedule;

      // Calcular estatísticas
      this.calculateStats();
      this.lastUpdate = new Date();

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Usar dados do cache local em caso de erro
      this.employees = this.localStorageService.getEmployeesSync();
      this.todayAttendance = this.localStorageService.getAttendanceSync()
        .filter(a => new Date(a.date).toDateString() === new Date().toDateString());
      this.workSchedule = this.localStorageService.getWorkScheduleSync();
      this.calculateStats();

      this.showToast('Erro ao carregar dados. Usando dados em cache.', 'danger');
    } finally {
      this.isLoading = false;
      clearTimeout(loadingTimeout);
      if (loader) {
        loader.dismiss().catch(() => {});
      }
    }
  }

  getStatusColor(status: AttendanceStatus | WorkStatus): string {
    return this.statusService.getStatusColor(status);
  }


  private calculateStatistics() {
    // Usando asserção para evitar problemas com null
    const employees = this.employees || [];
    const attendance = this.todayAttendance || [];

    // Atualizar status de cada registro
    this.todayAttendance = attendance.map(record => ({
      ...record,
      status: this.determineAttendanceStatus(record)
    }));

    // Calcular totais baseados no status
    this.totalPresent = this.todayAttendance.filter(a =>
      a.status === 'Presente' || a.status === 'Em exercício').length;

    this.totalLate = this.todayAttendance.filter(a =>
      a.status === 'Atrasado').length;

    this.totalJustified = this.todayAttendance.filter(a =>
      a.status === 'Justificado').length;

    this.totalAbsent = employees.length - this.totalPresent - this.totalLate - this.totalJustified;
  }

  private determineAttendanceStatus(attendance: Attendance): AttendanceStatus {
    if (attendance.status) {
      return attendance.status;
    }

    if (attendance.check_in && !attendance.check_out) {
      return 'Em exercício';
    } else if (attendance.check_in && attendance.check_out) {
      return 'Presente';
    } else {
      return 'Ausente';
    }
  }

  async loadTodayAttendance() {
    try {
      this.isLoading = true;

      // Usar o cache service para obter presença de hoje (sempre atualizada)
      this.cacheService.getTodayAttendance()
        .subscribe(
          (attendanceData) => {
            console.log('Dados de presença carregados:', attendanceData.length);
            this.todayAttendance = attendanceData
              .sort((a, b) => {
                const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return timeA - timeB;
              });

            this.calculateStatistics();
            this.lastUpdate = new Date();

            // Se estiver online, sincronizar dados
            if (this.isOnline && this.pendingSyncCount > 0) {
              this.syncData(false);
            }
          },
          (error) => {
            console.error('Erro ao carregar presenças:', error);

            // Fallback para cache local
            const localAttendance = this.localStorageService.getTodayAttendance();
            this.todayAttendance = localAttendance;
            this.calculateStatistics();

            this.showToast('Não foi possível atualizar os dados de presença.', 'warning');
          },
          () => {
            this.isLoading = false;
          }
        );
    } catch (error) {
      console.error('Erro ao carregar presenças:', error);
      this.isLoading = false;
      this.showToast('Erro ao carregar dados de presença', 'danger');
    }
  }

  async syncData(showFeedback = true) {
    if (!this.isOnline) {
      if (showFeedback) {
        this.showToast('Sem conexão com a internet. Os dados serão sincronizados automaticamente quando a conexão for restaurada.', 'warning');
      }
      return;
    }

    try {
      let loader: any;

      if (showFeedback) {
        loader = await this.loadingController.create({
          message: 'Sincronizando dados...',
          spinner: 'circles',
          duration: 10000 // timeout de 10 segundos
        });

        await loader.present();
      }

      await this.syncService.syncAll();

      if (loader) {
        await loader.dismiss();
      }

      if (showFeedback) {
        this.showToast('Dados sincronizados com sucesso!', 'success');
      }

      // Recarregar dados após sincronização
      this.loadAllData(false);
    } catch (error) {
      console.error('Erro na sincronização:', error);
      if (showFeedback) {
        this.showToast('Erro na sincronização. Tente novamente mais tarde.', 'danger');
      }
    }
  }

  async refreshData(event: any) {
    try {
      await this.loadAllData(false);

      // Se online e houver pendências, sincronizar
      if (this.isOnline && this.pendingSyncCount > 0) {
        await this.syncData(false);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      this.showToast('Erro ao atualizar dados', 'danger');
    } finally {
      event.target.complete();
    }
  }

  /**
   * Calcula estatísticas de presença para o dia
   */
  private calculateStats() {
    this.totalPresent = this.todayAttendance.filter(a => a.status === 'Presente').length;
    this.totalLate = this.todayAttendance.filter(a => a.status === 'Atrasado').length;
    this.totalAbsent = this.todayAttendance.filter(a => a.status === 'Ausente').length;
    this.totalJustified = this.todayAttendance.filter(a => a.status === 'Justificado').length;
  }

  /**
   * Exibe uma mensagem de toast
   */
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
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
    return `${greeting}, ${this.userEmail.split('@')[0]}`;
  }

  async goToAttendanceControl() {
    await this.router.navigate(['/admin/attendance']);
  }

  async goToKiosk() {
    await this.router.navigate(['/kiosk']);
  }

  getStatusLabel(status: AttendanceStatus): string {
    return status;
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
