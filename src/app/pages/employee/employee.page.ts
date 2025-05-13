import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { IonicModule, ToastController, ModalController, AnimationController } from '@ionic/angular';
import { Employee, CreateEmployeeDto } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { SuccessModalComponent } from '../../components/success-modal/success-modal.component';
import { EmployeeDetailsComponent } from '../../components/employee-details/employee-details.component';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.page.html',
  styleUrls: ['./employee.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    IonicModule,
    HttpClientModule, // Add HttpClientModule to imports
    SuccessModalComponent,
    EmployeeDetailsComponent,
    ConfirmModalComponent
  ],
  providers: [EmployeeService] // Add EmployeeService to providers
})
export class EmployeePage implements OnInit {
  employeeForm: FormGroup;
  employees: Employee[] = [];
  isLoading = false;
  departments = [
    'Administracao',
    'Informatica',
    'Costura',
    'Projecto',
    'Direccao',
    'Seguranca'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private employeeService: EmployeeService,
    private toastController: ToastController,
    private modalController: ModalController,
    private animationCtrl: AnimationController
  ) {
    this.employeeForm = this.formBuilder.group({
      name: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.pattern(/^[A-Za-zÀ-ÿ]+\s+[A-Za-zÀ-ÿ\s]+$/), // Exige pelo menos duas palavras
        this.fullNameValidator() // Validator personalizado
      ]],
      position: ['', Validators.required],
      department: ['', Validators.required]
    });

    // Monitor de mudanças no formulário
    this.employeeForm.valueChanges.subscribe(values => {
      console.log('Formulário atualizado:', values);
      this.validateForm();
    });
  }

  ngOnInit() {
    this.loadEmployees();
  }

  async loadEmployees() {
    console.log('Iniciando carregamento de funcionários...');
    try {
      this.isLoading = true;
      this.employees = await this.employeeService.getEmployees();
      console.log('Funcionários carregados:', this.employees);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      this.showToast('Erro ao carregar funcionários', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit() {
    console.log('onSubmit iniciado - Form válido:', this.employeeForm.valid);
    console.log('Valores do formulário:', this.employeeForm.value);

    if (this.employeeForm.valid) {
      try {
        // Verificar duplicata antes de criar
        const isDuplicate = await this.employeeService.checkDuplicateName(this.employeeForm.value.name);
        
        if (isDuplicate) {
          this.showToast('Já existe um funcionário cadastrado com este nome', 'warning');
          return;
        }

        console.log('Tentando criar funcionário...');
        const employee = await this.employeeService.createEmployee(this.employeeForm.value);
        console.log('Funcionário criado com sucesso:', employee);
        
        await this.showSuccessModal(employee.name, employee.internal_code);
        this.employeeForm.reset();
        this.loadEmployees();
      } catch (error) {
        console.error('Erro ao criar funcionário:', error);
        this.showErrorModal();
      }
    } else {
      console.warn('Formulário inválido:', this.employeeForm.errors);
      Object.keys(this.employeeForm.controls).forEach(key => {
        const control = this.employeeForm.get(key);
        if (control?.errors) {
          console.warn(`Erros no campo ${key}:`, control.errors);
        }
      });
    }
  }

  createEmployee() {
    if (this.employeeForm.valid) {
      const employeeData: CreateEmployeeDto = {
        name: this.employeeForm.get('name')?.value,
        position: this.employeeForm.get('position')?.value,
        department: this.employeeForm.get('department')?.value
      };
      // ...existing code...
    }
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
    
    if (createNew) {
      this.employeeForm.reset();
    }
  }

  private async showErrorModal() {
    console.error('Mostrando modal de erro');
    const modal = await this.modalController.create({
      component: SuccessModalComponent,
      componentProps: {
        title: 'Erro',
        message: 'Ocorreu um erro ao cadastrar o funcionário. Tente novamente.'
      }
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

  // Método auxiliar para validação
  validateForm() {
    console.log('Estado atual do formulário:', {
      valid: this.employeeForm.valid,
      dirty: this.employeeForm.dirty,
      touched: this.employeeForm.touched,
      values: this.employeeForm.value,
      errors: this.employeeForm.errors
    });
  }

  // Validator personalizado para nome completo
  private fullNameValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const names = value.trim().split(/\s+/);
      
      if (names.length < 2) {
        return { fullName: 'Digite nome e sobrenome' };
      }

      // Fix the TypeScript error by adding type
      if (names.some((name: string) => name.length < 2)) {
        return { fullName: 'Cada nome deve ter pelo menos 2 letras' };
      }

      return null;
    };
  }

  // Método para mostrar mensagens de erro específicas
  getErrorMessage(controlName: string): string {
    const control = this.employeeForm.get(controlName);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo é obrigatório';
      }
      if (control.errors['minlength']) {
        return 'Nome deve ter pelo menos 5 caracteres';
      }
      if (control.errors['pattern']) {
        return 'Digite nome e sobrenome válidos';
      }
      if (control.errors['fullName']) {
        return control.errors['fullName'];
      }
    }
    return '';
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

  async editEmployee(employee: Employee) {
    this.employeeForm.patchValue(employee);
    // Adicionar lógica para mostrar formulário de edição
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
}