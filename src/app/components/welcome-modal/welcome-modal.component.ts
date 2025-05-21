import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome-modal',
  template: `
    <ion-content class="welcome-modal-content ion-text-center">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="success-icon">
            <ion-icon name="checkmark-circle-outline" class="animate-success"></ion-icon>
          </div>
          <h2 class="title">{{ title }}</h2>
          <p class="message">{{ message }}</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .welcome-modal-content {
      --background: transparent;
    }

    .modal-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      background: rgba(255, 255, 255, 0.9);
    }

    .modal-container {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      width: 90%;
      max-width: 320px;
      margin: auto;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
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
      font-size: 64px;
      color: var(--ion-color-success);
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
      font-size: 24px;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .message {
      color: var(--ion-color-medium);
      font-size: 16px;
      margin: 0;
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
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class WelcomeModalComponent {
  @Input() title: string = 'Bem-vindo de volta!';
  @Input() message: string = '';

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }
} 