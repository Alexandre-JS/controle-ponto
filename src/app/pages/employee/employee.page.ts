import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, ModalController, AnimationController } from '@ionic/angular';
import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { SuccessModalComponent } from '../../components/success-modal/success-modal.component';
import { EmployeeDetailsComponent } from '../../components/employee-details/employee-details.component';
import { EmployeeFormModalComponent } from '../../components/employee-form-modal/employee-form-modal.component';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.page.html',
  styleUrls: ['./employee.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    HttpClientModule, // Add HttpClientModule to imports
    SuccessModalComponent,
    EmployeeDetailsComponent,
    EmployeeFormModalComponent,
    ThemeToggleComponent,
    ConfirmModalComponent,
    AppHeaderComponent
  ],
  providers: [EmployeeService] // Add EmployeeService to providers
})
export class EmployeePage implements OnInit {
  employees: Employee[] = [];
  sortedEmployees: Employee[] = [];
  isSortedAsc: boolean = true;
  isLoading = false;

  constructor(
    private employeeService: EmployeeService,
    private toastController: ToastController,
    private modalController: ModalController,
    private animationCtrl: AnimationController
  ) {}

  ngOnInit() {
    this.loadEmployees();
  }

  async loadEmployees() {
    try {
      this.isLoading = true;
      console.log('Loading employees...');

      this.employees = await this.employeeService.getEmployees();
      console.log('Employees loaded:', this.employees);

      if (this.employees.length === 0) {
        this.showToast('Nenhum funcionário cadastrado', 'info');
      }
      this.sortEmployees();
    } catch (error) {
      console.error('Error loading employees:', error);
      this.showToast('Erro ao carregar funcionários', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  toggleSort(): void {
    this.isSortedAsc = !this.isSortedAsc;
    this.sortEmployees();
  }

  private sortEmployees(): void {
    this.sortedEmployees = [...this.employees].sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      return this.isSortedAsc
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
  }

  private async showSuccessModal(name: string, code: string) {
    console.log('Configurando modal com:', { name, code });
    const modal = await this.modalController.create({
      component: SuccessModalComponent,
      componentProps: {
        employeeName: name,
        employeeCode: code
      },
      cssClass: 'success-modal',
      breakpoints: [0, 0.8],
      initialBreakpoint: 0.8,
      backdropDismiss: false,
      showBackdrop: true
    });

    console.log('Modal criado, tentando apresentar...');
    await modal.present();
    console.log('Modal apresentado');

    const { data: createNew } = await modal.onWillDismiss();
    console.log('Modal fechado com resultado:', createNew);
  }

  private async showErrorModal(message: string) {
    const modal = await this.modalController.create({
      component: ConfirmModalComponent,
      componentProps: {
        title: 'Erro',
        message: message,
        showCancelButton: false,
        confirmText: 'OK'
      },
      cssClass: 'error-modal'
    });
    await modal.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }

  async showEmployeeDetails(employee: Employee) {
    const modal = await this.modalController.create({
      component: EmployeeDetailsComponent,
      componentProps: {
        employee: employee
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      if (data.action === 'edit') {
        this.editEmployee(data.employee);
      } else if (data.action === 'delete') {
        this.deleteEmployee(data.employee);
      }
    }
  }

  async openDetails(employee: Employee) {
    const modal = await this.modalController.create({
      component: EmployeeDetailsComponent,
      componentProps: {
        employee: employee
      },
      breakpoints: [0, 0.5, 0.8],
      initialBreakpoint: 0.8
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        if (result.data.action === 'edit') {
          // Handle edit action
          this.editEmployee(result.data.employee);
        } else if (result.data.action === 'delete') {
          // Handle delete action
          await this.deleteEmployee(result.data.employee);
        }
      }
    });

    return await modal.present();
  }

  async editEmployee(employee: Employee) {
    // TODO: Implementar modal de edição de funcionário
    console.log('Editar funcionário:', employee);
  }

  async deleteEmployee(employee: Employee) {
    const confirmModal = await this.modalController.create({
      component: ConfirmModalComponent,
      componentProps: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir o funcionário ${employee.name}?`
      },
      cssClass: 'confirm-modal'
    });

    await confirmModal.present();
    const { data: confirmed } = await confirmModal.onWillDismiss();

    if (confirmed) {
      try {
        if (!employee.id) {
          throw new Error('ID do funcionário não encontrado');
        }
        await this.employeeService.deleteEmployee(employee.id);
        this.showToast('Funcionário excluído com sucesso', 'success');
        this.loadEmployees();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        this.showToast('Erro ao excluir funcionário. Tente novamente.', 'danger');
      }
    }
  }

  async openEmployeeFormModal() {
    const modal = await this.modalController.create({
      component: EmployeeFormModalComponent,
      breakpoints: [0, 0.8, 1],
      initialBreakpoint: 0.8,
      cssClass: 'employee-form-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      // Se um funcionário foi criado, recarregar a lista
      await this.loadEmployees();
    }
  }
}
