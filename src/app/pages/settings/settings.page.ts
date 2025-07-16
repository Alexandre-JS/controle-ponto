import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { EmployeeService } from '../../services/employee.service';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-settings',
  template: `
    <app-header
      title="Configurações"
      icon="settings-outline"
      [showMenu]="true"
      [showNotifications]="false"
      [showThemeToggle]="true">
    </app-header>

    <ion-content class="ion-padding">
      <form [formGroup]="scheduleForm" (ngSubmit)="onSubmit()">
        <ion-list class="form-list">
          <ion-item class="form-item">
            <ion-label position="stacked">Horário de Início</ion-label>
            <ion-input
              type="time"
              formControlName="start_time"
              placeholder="08:00">
            </ion-input>
          </ion-item>

          <ion-item class="form-item">
            <ion-label position="stacked">Horário de Término</ion-label>
            <ion-input
              type="time"
              formControlName="end_time"
              placeholder="16:00">
            </ion-input>
          </ion-item>

          <ion-item class="form-item">
            <ion-label>Dias de Trabalho</ion-label>
            <ion-select multiple="true" formControlName="work_days">
              <ion-select-option value="1">Segunda</ion-select-option>
              <ion-select-option value="2">Terça</ion-select-option>
              <ion-select-option value="3">Quarta</ion-select-option>
              <ion-select-option value="4">Quinta</ion-select-option>
              <ion-select-option value="5">Sexta</ion-select-option>
              <ion-select-option value="6">Sábado</ion-select-option>
              <ion-select-option value="7">Domingo</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <ion-button expand="block" type="submit" [disabled]="!scheduleForm.valid || isLoading" class="app-button">
          <ion-icon name="save-outline" slot="start"></ion-icon>
          Salvar Configurações
        </ion-button>
      </form>

      <ion-loading [isOpen]="isLoading" message="Salvando..."></ion-loading>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, AppHeaderComponent]
})
export class SettingsPage implements OnInit {
  scheduleForm: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private employeeService: EmployeeService,
    private toastController: ToastController
  ) {
    this.scheduleForm = this.formBuilder.group({
      start_time: ['08:00', Validators.required],
      end_time: ['16:00', Validators.required],
      work_days: [[1,2,3,4,5], Validators.required]
    });
  }

  async ngOnInit() {
    await this.loadCurrentSchedule();
  }

  async loadCurrentSchedule() {
    try {
      this.isLoading = true;
      const schedule = await this.employeeService.getWorkSchedule();
      this.scheduleForm.patchValue({
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        work_days: schedule.work_days.map(day => day.toString())
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      this.showToast('Erro ao carregar configurações', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit() {
    if (this.scheduleForm.valid) {
      try {
        this.isLoading = true;
        await this.employeeService.setWorkSchedule({
          start_time: this.scheduleForm.value.start_time,
          end_time: this.scheduleForm.value.end_time,
          work_days: this.scheduleForm.value.work_days.map(Number)
        });
        this.showToast('Configurações salvas com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao salvar:', error);
        this.showToast('Erro ao salvar configurações', 'danger');
      } finally {
        this.isLoading = false;
      }
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'middle'
    });
    await toast.present();
  }
}
