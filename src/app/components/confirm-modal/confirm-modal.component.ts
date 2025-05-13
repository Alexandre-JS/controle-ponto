import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  template: `
    <ion-header>
      <ion-toolbar color="danger">
        <ion-title>Confirmar Exclusão</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="confirm-content">
        <ion-icon name="warning" color="danger"></ion-icon>
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
        
        <div class="action-buttons">
          <ion-button fill="outline" (click)="dismiss(false)">
            Cancelar
          </ion-button>
          <ion-button color="danger" (click)="dismiss(true)">
            Confirmar
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .confirm-content {
      text-align: center;
      padding: 20px;
    }
    ion-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h2 {
      margin-bottom: 16px;
      font-weight: 600;
    }
    p {
      margin-bottom: 24px;
      color: var(--ion-color-medium);
    }
    .action-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ConfirmModalComponent {
  @Input() title: string = 'Confirmar Exclusão';
  @Input() message: string = 'Tem certeza que deseja excluir este funcionário?';

  constructor(private modalCtrl: ModalController) {}

  dismiss(confirmed: boolean) {
    this.modalCtrl.dismiss(confirmed);
  }
}
