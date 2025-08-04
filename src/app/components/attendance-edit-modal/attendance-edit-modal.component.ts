import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Attendance, AttendanceStatus } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-attendance-edit-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Editar Registro de Ponto</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>{{ attendanceRecord?.date }}</ion-card-subtitle>
          <ion-card-title>{{ attendanceRecord?.employee?.name || 'Funcionário' }}</ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <form [formGroup]="editForm" (ngSubmit)="onSubmit()">
            <ion-list>
              <ion-item>
                <ion-label position="stacked">Horário de Entrada</ion-label>
                <ion-input type="time" formControlName="checkIn"></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Horário de Saída</ion-label>
                <ion-input type="time" formControlName="checkOut"></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Status</ion-label>
                <ion-select formControlName="status">
                  <ion-select-option value="Presente">Presente</ion-select-option>
                  <ion-select-option value="Atrasado">Atrasado</ion-select-option>
                  <ion-select-option value="Ausente">Ausente</ion-select-option>
                  <ion-select-option value="Justificado">Justificado</ion-select-option>
                </ion-select>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Observações</ion-label>
                <ion-textarea rows="3" formControlName="observations"></ion-textarea>
              </ion-item>
            </ion-list>
            
            <div class="ion-padding">
              <ion-button expand="block" type="submit" [disabled]="!editForm.valid || isSubmitting">
                <ion-icon name="save-outline" slot="start"></ion-icon>
                Salvar Alterações
              </ion-button>
            </div>
          </form>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    ion-card {
      margin: 0;
    }
  `]
})
export class AttendanceEditModalComponent implements OnInit {
  @Input() attendanceRecord: any;
  
  editForm: FormGroup;
  isSubmitting = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private modalCtrl: ModalController,
    private employeeService: EmployeeService,
    private toastCtrl: ToastController
  ) {
    this.editForm = this.formBuilder.group({
      checkIn: ['', Validators.required],
      checkOut: [''],
      status: ['Presente', Validators.required],
      observations: ['']
    });
  }
  
  ngOnInit() {
    if (this.attendanceRecord) {
      this.editForm.patchValue({
        checkIn: this.attendanceRecord.check_in,
        checkOut: this.attendanceRecord.check_out || '',
        status: this.attendanceRecord.status || 'Presente',
        observations: this.attendanceRecord.observations || ''
      });
    }
  }
  
  async onSubmit() {
    if (this.editForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      try {
        const formValues = this.editForm.value;
        
        // Preparar dados para atualização
        const updateData: Partial<Attendance> = {
          check_in: formValues.checkIn,
          status: formValues.status as AttendanceStatus
        };
        
        // Incluir check_out apenas se preenchido
        if (formValues.checkOut) {
          updateData.check_out = formValues.checkOut;
        }
        
        // Incluir observações apenas se preenchido
        if (formValues.observations) {
          updateData.observations = formValues.observations;
        }
        
        // Calcular atraso baseado no horário de entrada
        if (formValues.checkIn) {
          // Obter o horário programado do funcionário
          const workSchedule = await this.employeeService.getWorkSchedule();
          const lateMinutes = this.calculateLateMinutes(formValues.checkIn, workSchedule.start_time);
          updateData.late_minutes = lateMinutes;
          
          // Atualizar status baseado no atraso, se não foi alterado manualmente
          if (!this.editForm.get('status')?.dirty) {
            updateData.status = lateMinutes > 0 ? 'Atrasado' : 'Presente';
          }
        }
        
        // Atualizar registro
        const updatedRecord = await this.employeeService.updateAttendanceRecord(
          this.attendanceRecord.id,
          updateData
        );
        
        // Mostrar mensagem de sucesso
        const toast = await this.toastCtrl.create({
          message: 'Registro atualizado com sucesso',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
        
        // Fechar modal retornando o registro atualizado
        this.modalCtrl.dismiss(updatedRecord);
        
      } catch (error: any) {
        console.error('Erro ao atualizar registro:', error);
        
        // Mostrar mensagem de erro
        const toast = await this.toastCtrl.create({
          message: error.message || 'Erro ao atualizar registro',
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
        
      } finally {
        this.isSubmitting = false;
      }
    }
  }
  
  dismiss() {
    this.modalCtrl.dismiss();
  }
  
  private calculateLateMinutes(timeIn: string, startTime: string): number {
    if (!timeIn || !startTime) return 0;
    
    try {
      const [inHour, inMinute] = timeIn.split(':').map(Number);
      const [startHour, startMinute] = startTime.split(':').map(Number);
      
      const totalInMinutes = inHour * 60 + inMinute;
      const totalStartMinutes = startHour * 60 + startMinute;
      
      return Math.max(0, totalInMinutes - totalStartMinutes);
    } catch (error) {
      console.error('Erro ao calcular atraso:', error);
      return 0;
    }
  }
}
