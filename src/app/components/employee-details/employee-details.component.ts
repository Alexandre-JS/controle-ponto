import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Employee } from '../../models/employee.model';
import { AppQRCodeModule } from '../../shared/qr-code.module';

@Component({
  selector: 'app-employee-details',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="light">
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()" color="medium">
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="employee-header">
        <div class="avatar">
          <ion-icon name="person-circle"></ion-icon>
        </div>
        <h1>{{ employee.name }}</h1>
        <div class="employee-code">
          <ion-chip color="primary" outline="true">
            <ion-icon name="barcode-outline"></ion-icon>
            <ion-label>{{ employee.internal_code }}</ion-label>
          </ion-chip>
        </div>
      </div>

      <ion-list lines="none" class="details-list">
        <ion-item>
          <ion-icon name="finger-print-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h3>ID</h3>
            <p>{{ employee.id }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="briefcase-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h3>Cargo</h3>
            <p>{{ employee.position }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="business-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h3>Departamento</h3>
            <p>{{ employee.department }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="calendar-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h3>Data de Cadastro</h3>
            <p>{{ employee.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="qr-code-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h3>QR Code de Identificação</h3>
            <div class="qr-code-container">
              <app-qr-code
                [value]="getQRCodeValue()"
                cssClass="qr-code-image">
              </app-qr-code>
              <ion-button size="small" (click)="downloadQRCode()">
                <ion-icon name="download-outline" slot="start"></ion-icon>
                Download QR Code
              </ion-button>
            </div>
          </ion-label>
        </ion-item>
      </ion-list>

      <div class="action-buttons">
        <ion-button expand="block" (click)="editEmployee()" color="primary" class="edit-button">
          <ion-icon name="create-outline" slot="start"></ion-icon>
          Editar Funcionário
        </ion-button>
        
        <ion-button expand="block" (click)="confirmDelete()" color="danger" fill="outline" class="delete-button">
          <ion-icon name="trash-outline" slot="start"></ion-icon>
          Excluir Funcionário
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .employee-header {
      text-align: center;
      padding: 20px 0;
      background: var(--ion-color-light);
      border-radius: 16px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .avatar {
      width: 100px;
      height: 100px;
      margin: 0 auto 16px;
      background: var(--ion-color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      ion-icon {
        font-size: 64px;
        color: white;
      }
    }

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .employee-code {
      margin-top: 12px;
      ion-chip {
        --background: transparent;
        font-size: 14px;
      }
    }

    .details-list {
      margin: 20px 0;
      background: var(--ion-color-light);
      border-radius: 16px;
      padding: 8px;

      ion-item {
        --background: transparent;
        --padding-start: 16px;
        --padding-end: 16px;
        --padding-top: 12px;
        --padding-bottom: 12px;
        margin-bottom: 8px;
        border-radius: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        ion-icon {
          font-size: 24px;
          margin-right: 16px;
        }

        h3 {
          font-size: 14px;
          font-weight: 500;
          color: var(--ion-color-medium);
          margin: 0 0 4px 0;
        }

        p {
          font-size: 16px;
          color: var(--ion-color-dark);
          margin: 0;
        }
      }
    }

    .action-buttons {
      padding: 16px 0;

      ion-button {
        margin-bottom: 12px;
        height: 48px;
        --border-radius: 12px;
        font-weight: 500;
        
        &:last-child {
          margin-bottom: 0;
        }
      }

      .edit-button {
        --box-shadow: 0 4px 8px rgba(var(--ion-color-primary-rgb), 0.2);
      }

      .delete-button {
        --border-width: 2px;
      }
    }

    .qr-code-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 10px;
    }

    .qr-code-image {
      width: 200px;
      height: 200px;
      margin-bottom: 10px;
    }

    @media (prefers-color-scheme: dark) {
      .employee-header, .details-list {
        background: rgba(var(--ion-color-light-rgb), 0.05);
      }

      h1 {
        color: var(--ion-color-light);
      }

      .details-list ion-item p {
        color: var(--ion-color-light);
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, AppQRCodeModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EmployeeDetailsComponent {
  @Input() employee!: Employee;

  constructor(private modalCtrl: ModalController) {}

  dismiss(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  editEmployee() {
    this.dismiss({ action: 'edit', employee: this.employee });
  }

  async confirmDelete() {
    this.dismiss({ action: 'delete', employee: this.employee });
  }

  getQRCodeData(): string {
    if (!this.employee) return '';
    return JSON.stringify({
      id: this.employee.id,
      name: this.employee.name,
      internal_code: this.employee.internal_code,
      department: this.employee.department
    });
  }

  getQRCodeValue(): string {
    if (!this.employee) return '';
    // Usar o internal_code diretamente
    return this.employee.internal_code;
  }

  downloadQRCode(): void {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `qrcode-${this.employee?.internal_code}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
