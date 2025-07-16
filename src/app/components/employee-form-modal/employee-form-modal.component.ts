import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Employee, CreateEmployeeDto } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-form-modal',
  templateUrl: './employee-form-modal.component.html',
  styleUrls: ['./employee-form-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class EmployeeFormModalComponent implements OnInit {
  employeeForm: FormGroup;
  isLoading = false;
  departments = [
    'Administracao',
    'Informatica',
    'Costura',
    'Biblioteca',
    'Segurança',
  ];

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController,
    private employeeService: EmployeeService,
    private toastController: ToastController
  ) {
    this.employeeForm = this.formBuilder.group({
      name: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.pattern(/^[A-Za-zÀ-ÿ]+\s+[A-Za-zÀ-ÿ\s]+$/),
        this.fullNameValidator()
      ]],
      position: ['', Validators.required],
      department: ['', Validators.required]
    });
  }

  ngOnInit() {}

  async onSubmit() {
    if (this.employeeForm.valid) {
      try {
        this.isLoading = true;
        const formValue = this.employeeForm.value;
        const employeeData: CreateEmployeeDto = {
          name: formValue.name,
          position: formValue.position,
          department: formValue.department
        };

        const isDuplicate = await this.employeeService.checkDuplicateName(employeeData.name);
        if (isDuplicate) {
          this.showToast('Já existe um funcionário cadastrado com este nome', 'warning');
          return;
        }

        const employee = await this.employeeService.createEmployee(employeeData);
        this.showToast('Funcionário cadastrado com sucesso!', 'success');
        this.employeeForm.reset();
        this.dismiss(true); // Retorna true para indicar que um funcionário foi criado
      } catch (error: any) {
        console.error('Erro ao criar funcionário:', error);
        this.showToast(error.message || 'Erro ao cadastrar funcionário', 'danger');
      } finally {
        this.isLoading = false;
      }
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }

  private fullNameValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const names = value.trim().split(/\s+/);

      if (names.length < 2) {
        return { fullName: 'Digite nome e sobrenome' };
      }

      if (names.some((name: string) => name.length < 2)) {
        return { fullName: 'Cada nome deve ter pelo menos 2 letras' };
      }

      return null;
    };
  }

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

  dismiss(data?: any) {
    this.modalController.dismiss(data);
  }

  cancel() {
    this.dismiss();
  }
}
