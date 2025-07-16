import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Employee, Attendance, AttendanceStatus, WorkStatus } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { Router } from '@angular/router';
import { StatusService } from '../../services/status.service';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.page.html',
  styleUrls: ['./attendance.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, ThemeToggleComponent, AppHeaderComponent]
})
export class AttendancePage implements OnInit {
  attendanceForm: FormGroup;
  employees: Employee[] = [];
  todayAttendance: Attendance[] = [];
  isLoading = false;
  loadError = false;

  constructor(
    private formBuilder: FormBuilder,
    private employeeService: EmployeeService,
    private toastController: ToastController,
    private router: Router,
    private statusService: StatusService
  ) {
    this.attendanceForm = this.formBuilder.group({
      employee_id: ['', Validators.required],
      date: [new Date().toISOString(), Validators.required],
      check_in: [new Date().toTimeString().substring(0, 5), Validators.required],
      status: ['Presente', Validators.required],
      observations: [''],
      auth_method: ['code']
    });
  }

  async ngOnInit() {
    await this.loadEmployees();
    await this.loadTodayAttendance();
  }

  async loadInitialData() {
    this.isLoading = true;
    this.loadError = false;

    try {
      await Promise.all([
        this.loadEmployees(),
        this.loadTodayAttendance()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      this.loadError = true;
      this.showToast('Erro ao carregar dados', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async retry() {
    await this.loadInitialData();
  }

  async loadEmployees() {
    try {
      this.isLoading = true;
      this.employees = await this.employeeService.getEmployees();

      if (this.employees.length === 0) {
        this.showToast('Nenhum funcionário cadastrado. Cadastre funcionários primeiro.', 'warning');
        await this.router.navigate(['/employee']); // Redireciona para página de cadastro
        return;
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      this.showToast('Erro ao carregar funcionários', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async loadTodayAttendance() {
    if (this.employees.length === 0) return; // Não carrega presenças se não há funcionários

    try {
      const today = new Date();
      const attendanceData = await this.employeeService.getAttendanceByMonth(
        today.getFullYear(),
        today.getMonth() + 1
      );

      this.todayAttendance = attendanceData.filter(record =>
        new Date(record.date).toDateString() === today.toDateString()
      );
    } catch (error) {
      console.error('Erro ao carregar presenças:', error);
      this.showToast('Erro ao carregar registros de presença', 'danger');
    }
  }

  async onSubmit() {
    if (this.attendanceForm.valid) {
      try {
        const formValue = this.attendanceForm.value;
        await this.employeeService.registerAttendance(
          formValue.employee_id,
          formValue.auth_method
        );
        this.showToast('Presença registrada com sucesso', 'success');
        this.attendanceForm.reset({
          date: new Date().toISOString(),
          status: 'Presente',
          auth_method: 'code'
        });
        this.loadTodayAttendance();
      } catch (error) {
        this.showToast('Erro ao registrar presença', 'danger');
      }
    }
  }

  getEmployeeName(id: string): string {
    const employee = this.employees.find(emp => emp.id === id);
    return employee ? employee.name : 'Funcionário não encontrado';
  }

  getStatusColor(status: AttendanceStatus | WorkStatus): string {
    return this.statusService.getStatusColor(status);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'middle'
    });
    toast.present();
  }
}
