import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attendance-confirmation',
  template: `
    <ion-content class="confirmation-modal">
      <div class="modal-container" [class.success-state]="showSuccess">
        <ion-icon *ngIf="!showSuccess"
                 [name]="isCheckOut ? 'log-out-outline' : 'log-in-outline'" 
                 [color]="isCheckOut ? 'warning' : 'primary'">
        </ion-icon>
        
        <ion-icon *ngIf="showSuccess" 
                  name="checkmark-circle" 
                  color="success" 
                  class="success-icon">
        </ion-icon>

        <ng-container *ngIf="!showSuccess">
          <h2>{{ isCheckOut ? 'Confirmação de Saída' : 'Confirmação de Entrada' }}</h2>
          <p class="employee-name">{{ employeeName }}</p>
          <p class="time">{{ currentTime }}</p>

          <div class="confirmation-buttons">
            <ion-button fill="outline" (click)="dismiss(false)">
              <ion-icon name="close-outline" slot="start"></ion-icon>
              Cancelar
            </ion-button>
            <ion-button (click)="confirm()" [color]="isCheckOut ? 'warning' : 'primary'">
              <ion-icon [name]="isCheckOut ? 'log-out-outline' : 'log-in-outline'" slot="start"></ion-icon>
              {{ isCheckOut ? 'Confirmar Saída' : 'Confirmar Entrada' }}
            </ion-button>
          </div>
        </ng-container>

        <ng-container *ngIf="showSuccess">
          <h2>{{ successMessage }}</h2>
          <p class="employee-name">{{ employeeName }}</p>
          <div class="confirmation-buttons">
            <ion-button (click)="dismiss(true)" color="success">
              <ion-icon name="checkmark-outline" slot="start"></ion-icon>
              OK
            </ion-button>
          </div>
        </ng-container>
      </div>
    </ion-content>
  `,
  styles: [`
    .confirmation-modal {
      --background: rgba(var(--ion-color-light-rgb), 0.95);
    }
    .modal-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      padding: 2rem;
      text-align: center;
      animation: fadeInScale 0.3s ease-out;
    }
    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    ion-icon {
      font-size: 64px;
      margin-bottom: 1rem;
    }
    h2 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--ion-color-dark);
    }
    .employee-name {
      font-size: 20px;
      color: var(--ion-color-primary);
      margin-bottom: 0.5rem;
    }
    .time {
      font-size: 32px;
      font-weight: bold;
      color: var(--ion-color-dark);
      margin-bottom: 2rem;
    }
    .confirmation-buttons {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    ion-button {
      min-width: 150px;
    }
    .success-state {
      animation: successPulse 0.5s ease-out;
    }
    .success-icon {
      font-size: 80px;
      animation: scaleIn 0.5s ease-out;
    }
    @keyframes successPulse {
      0% { transform: scale(0.95); opacity: 0; }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AttendanceConfirmationComponent {
  @Input() employeeName: string = '';
  @Input() currentTime: string = '';
  @Input() isCheckOut: boolean = false;
  
  showSuccess = false;
  successMessage: string = '';

  constructor(private modalCtrl: ModalController) {}

  private getSuccessMessage(): string {
    const messages = this.isCheckOut ? [
      'Até amanhã!',
      'Tenha um bom descanso!',
      'Bom retorno para casa!'
    ] : [
      'Bom trabalho!',
      'Tenha um ótimo dia!',
      'Bem-vindo(a)!'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  async confirm() {
    this.showSuccess = true;
    this.successMessage = this.getSuccessMessage();
  }

  dismiss(confirmed: boolean) {
    this.modalCtrl.dismiss(confirmed);
  }
}
