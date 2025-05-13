import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Confirmação</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="success-modal-content">
      <div class="modal-container">
        <div class="success-icon">
          <ion-icon name="checkmark-circle" class="animate-success"></ion-icon>
        </div>
        <h2 class="title">Parabéns!</h2>
        <div class="content">
          <p class="employee-name">
            <ion-icon name="person"></ion-icon>
            {{ employeeName }}
          </p>
          <p class="employee-code">
            <ion-icon name="barcode"></ion-icon>
            Código: {{ employeeCode }}
          </p>
        </div>
        <div class="buttons">
          <ion-button expand="block" (click)="dismiss(true)" class="new-employee-btn">
            <ion-icon name="add-circle" slot="start"></ion-icon>
            Cadastrar Novo Funcionário
          </ion-button>
          <ion-button expand="block" fill="outline" (click)="dismiss(false)" class="close-btn">
            <ion-icon name="close-circle" slot="start"></ion-icon>
            Fechar
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .success-modal-content {
      --background: linear-gradient(145deg, #f5f5f5, #ffffff);
    }

    .modal-container {
      padding: 2rem;
      text-align: center;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .success-icon {
      margin-bottom: 1.5rem;
    }

    .success-icon ion-icon {
      font-size: 5rem;
      color: var(--ion-color-success);
    }

    .animate-success {
      animation: scaleIn 0.5s ease-out;
    }

    @keyframes scaleIn {
      0% {
        transform: scale(0);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
      }
    }

    .title {
      color: var(--ion-color-dark);
      font-size: 1.8rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .content {
      margin: 2rem 0;
      background: rgba(var(--ion-color-success-rgb), 0.1);
      padding: 1.5rem;
      border-radius: 12px;
      animation: fadeIn 0.5s ease-out 0.3s both;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .employee-name, .employee-code {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0.5rem 0;
      font-size: 1.1rem;
    }

    .employee-name ion-icon, .employee-code ion-icon {
      font-size: 1.3rem;
      color: var(--ion-color-success);
    }

    .buttons {
      margin-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      animation: slideUp 0.3s ease-out 0.5s both;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .new-employee-btn {
      --background: var(--ion-color-success);
      --box-shadow: 0 4px 12px rgba(var(--ion-color-success-rgb), 0.3);
      transition: transform 0.2s;
    }

    .new-employee-btn:active {
      transform: scale(0.98);
    }

    .close-btn {
      --color: var(--ion-color-medium);
      --border-color: var(--ion-color-medium);
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SuccessModalComponent {
  @Input() employeeName: string = '';
  @Input() employeeCode: string = '';

  constructor(private modalCtrl: ModalController) {
    console.log('SuccessModalComponent construído');
  }

  dismiss(createNew: boolean) {
    console.log('Fechando modal com valor:', createNew);
    this.modalCtrl.dismiss(createNew);
  }
}
