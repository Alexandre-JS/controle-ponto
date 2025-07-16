import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { StatusService, WorkStatus } from '../../services/status.service';
import { interval, Subscription } from 'rxjs';
import { AttendanceStatus } from '../../models/employee.model';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-daily-attendance',
  templateUrl: './daily-attendance.page.html',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, ThemeToggleComponent, AppHeaderComponent]
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

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private authService: AuthService,
    public statusService: StatusService // Change to public
  ) {
    this.updateWorkStatus();
  }

  async ngOnInit() {
    this.startClock();
    await this.loadEmployees();
    await this.loadTodayAttendance();
    await this.loadUserProfile();
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

      this.todayAttendance = attendanceData
        .filter(record => new Date(record.date).toDateString() === today.toDateString())
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

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
}
