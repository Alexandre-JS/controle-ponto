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
    <ion-content class="ion-padding">
      <div *ngIf="!showSuccess">
        <h2>{{ employeeName }}</h2>
        <p>{{ currentTime }}</p>
        <p>{{ isCheckOut ? 'Saída' : 'Entrada' }}</p>
        
        <ion-button expand="block" (click)="confirm()">Confirmar</ion-button>
        <ion-button expand="block" color="medium" (click)="dismiss(false)">Cancelar</ion-button>
      </div>
      
      <div *ngIf="showSuccess" class="success-message">
        <ion-icon name="checkmark-circle" color="success"></ion-icon>
        <h2>{{ successMessage }}</h2>
        <ion-button expand="block" (click)="dismiss(true)">OK</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .success-message {
      text-align: center;
      padding: 2rem;
    }
    ion-icon {
      font-size: 64px;
      color: var(--ion-color-success);
    }
    h2 {
      margin: 1rem 0;
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
