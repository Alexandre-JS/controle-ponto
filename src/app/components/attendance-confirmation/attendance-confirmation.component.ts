import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-attendance-confirmation',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Confirmar Registro</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="attendance-confirmation-content">
      <div class="modal-container">
        <div *ngIf="!showSuccess" class="confirmation-content">
          <div class="user-info">
            <ion-icon name="person-circle" class="user-icon"></ion-icon>
            <h2>{{ employeeName }}</h2>
            <div class="time-info">
              <ion-icon name="time-outline"></ion-icon>
              <p>{{ currentTime }}</p>
            </div>
            <div class="type-info" [class.checkout]="isCheckOut">
              <ion-icon [name]="isCheckOut ? 'log-out-outline' : 'log-in-outline'"></ion-icon>
              <p>{{ isCheckOut ? 'Saída' : 'Entrada' }}</p>
            </div>
          </div>
          
          <div class="action-buttons">
            <ion-button expand="block" (click)="confirm()" class="confirm-btn">
              <ion-icon name="checkmark-circle" slot="start"></ion-icon>
              Confirmar
            </ion-button>
            <ion-button expand="block" fill="outline" (click)="dismiss(false)" class="cancel-btn">
              <ion-icon name="close-circle" slot="start"></ion-icon>
              Cancelar
            </ion-button>
          </div>
        </div>
        
        <div *ngIf="showSuccess" class="success-message">
          <ion-icon name="checkmark-circle" class="animate-success"></ion-icon>
          <h2>{{ successMessage }}</h2>
          <ion-button expand="block" (click)="dismiss(true)" class="ok-btn">
            <ion-icon name="checkmark" slot="start"></ion-icon>
            OK
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .attendance-confirmation-content {
      --background: linear-gradient(145deg, var(--app-primary-rgb-10), var(--app-secondary-rgb-10));
    }

    .modal-container {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--app-padding);
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .confirmation-content, .success-message {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
      background: var(--app-light);
      border-radius: var(--app-border-radius);
      box-shadow: var(--app-box-shadow);
      padding: calc(var(--app-padding) * 2);
    }

    .user-info {
      text-align: center;
      margin-bottom: 2rem;
    }

    .user-icon {
      font-size: 4rem;
      color: var(--app-primary);
      margin-bottom: 1rem;
    }

    h2 {
      color: var(--app-dark);
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0.5rem 0;
    }

    .time-info, .type-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0.5rem 0;
      padding: 0.5rem;
      background: rgba(var(--app-medium-rgb), 0.1);
      border-radius: var(--app-border-radius-sm);

      ion-icon {
        font-size: 1.2rem;
        color: var(--app-primary);
      }

      p {
        margin: 0;
        font-size: 1rem;
        color: var(--app-dark);
      }
    }

    .type-info {
      &.checkout {
        background: rgba(var(--app-warning-rgb), 0.1);
        ion-icon {
          color: var(--app-warning);
        }
      }
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .confirm-btn {
      --background: var(--app-primary);
      --box-shadow: 0 4px 12px rgba(var(--app-primary-rgb), 0.3);
      font-weight: 500;
      transition: transform 0.2s;

      &:active {
        transform: scale(0.98);
      }
    }

    .cancel-btn {
      --color: var(--app-medium);
      --border-color: var(--app-medium);
    }

    .success-message {
      text-align: center;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }

    .animate-success {
      font-size: 5rem;
      color: var(--app-success);
      margin-bottom: 1.5rem;
      animation: scaleIn 0.5s ease-out;
    }

    @keyframes scaleIn {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .ok-btn {
      --background: var(--app-success);
      --box-shadow: 0 4px 12px rgba(var(--app-success-rgb), 0.3);
      margin-top: 1.5rem;
    }

    @media (max-width: 480px) {
      .modal-container {
        padding: var(--app-padding-sm);
      }

      .confirmation-content, .success-message {
        padding: var(--app-padding);
      }

      .user-icon {
        font-size: 3rem;
      }

      h2 {
        font-size: 1.2rem;
      }
    }
  `]
})
export class AttendanceConfirmationComponent {
  @Input() employeeName: string = '';
  @Input() currentTime: string = '';
  @Input() isCheckOut: boolean = false;
  @Input() successResponse: any; // Adicionar novo input para receber a resposta
  
  showSuccess = false;
  successMessage = '';

  constructor(private modalCtrl: ModalController) {}

  confirm() {
    this.showSuccess = true;
    if (this.successResponse?.message) {
      this.successMessage = this.successResponse.message;
    } else {
      this.successMessage = `Ponto ${this.isCheckOut ? 'de saída' : 'de entrada'} registrado com sucesso!`;
    }
  }

  async dismiss(result: boolean) {
    await this.modalCtrl.dismiss(result);
  }
}
