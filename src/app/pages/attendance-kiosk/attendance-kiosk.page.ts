import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { AttendanceConfirmationComponent } from '../../components/attendance-confirmation/attendance-confirmation.component';
import { QRScannerComponent } from '../../components/qr-scanner/qr-scanner.component';
import { QRScannerModule } from '../../components/qr-scanner/qr-scanner.module';
import { AuthMethod } from '../../services/employee.service';

@Component({
  selector: 'app-attendance-kiosk',
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule, 
    FormsModule, 
    RouterModule,
    AttendanceConfirmationComponent,
    QRScannerComponent,
    QRScannerModule
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Registro de Ponto</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="goToAdmin()">
            <ion-icon slot="start" name="settings-outline"></ion-icon>
            Gerenciar Sistema
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding attendance-kiosk">
      <div class="kiosk-container">
        <h1 class="ion-text-center">IDENTIFIQUE-SE PARA</h1>
        <h2 class="ion-text-center">MARCAR PRESENÇA</h2>
        
        <div class="kiosk-buttons">
          <ion-item class="code-input">
            <ion-input 
              [(ngModel)]="employeeCode"
              (ionChange)="onCodeChange($event)"
              placeholder="Digite código (AEM123)"
              class="ion-text-center"
              maxlength="6"
              type="text"
              style="text-transform: uppercase;">
            </ion-input>
            <ion-note slot="helper" color="medium">Código: AEM + 3 números</ion-note>
            <ion-note slot="error" *ngIf="showError">Código inválido</ion-note>
          </ion-item>

          <ion-button expand="block" 
                      class="kiosk-button" 
                      (click)="markAttendance('code')"
                      [disabled]="!isValidCode">
            <ion-icon name="log-in-outline" slot="start" size="large"></ion-icon>
            MARCAR PONTO
          </ion-button>

          <div class="alternative-methods">
            <ion-button expand="block" 
                      class="kiosk-button" 
                      (click)="markAttendance('face')">
              <ion-icon name="camera-outline" slot="start" size="large"></ion-icon>
              FACE ID
            </ion-button>

            <ion-button expand="block" 
                      class="kiosk-button" 
                      (click)="markAttendance('fingerprint')">
              <ion-icon name="finger-print-outline" slot="start" size="large"></ion-icon>
              DIGITAL
            </ion-button>

            <ion-button expand="block" 
                      class="kiosk-button" 
                      (click)="showQRScanner()">
              <ion-icon name="qr-code-outline" slot="start" size="large"></ion-icon>
              ESCANEAR QR CODE
            </ion-button>
          </div>
        </div>

        <ion-loading [isOpen]="isLoading" message="Processando..."></ion-loading>
      </div>

      <ion-modal [isOpen]="isQRScannerVisible" (didDismiss)="hideQRScanner()">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Escanear QR Code</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="hideQRScanner()">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <app-qr-scanner (scanComplete)="onQRCodeScanned($event)"></app-qr-scanner>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  // styles: [`
  //   .attendance-kiosk {
  //     --background: linear-gradient(135deg, var(--app-primary), var(--app-secondary));
  //     min-height: 100vh;
  //     display: flex;
  //     align-items: center;
  //     justify-content: center;
  //     padding: var(--app-padding);
  //   }

  //   .kiosk-container {
  //     width: 100%;
  //     max-width: 500px;
  //     margin: 0 auto;
  //     padding: calc(var(--app-padding) * 2);
  //     background: var(--app-light);
  //     border-radius: var(--app-border-radius);
  //     box-shadow: var(--app-box-shadow);
  //   }

  //   h1, h2 {
  //     font-weight: bold;
  //     color: var(--app-primary);
  //     text-align: center;
  //     margin: 0;
  //   }

  //   h1 {
  //     font-size: var(--app-font-size-xlarge);
  //     margin-bottom: 0.5rem;
  //   }

  //   h2 {
  //     font-size: var(--app-font-size-large);
  //     color: var(--app-secondary);
  //     margin-bottom: 2rem;
  //   }

  //   .kiosk-buttons {
  //     margin-top: calc(var(--app-margin) * 2);
  //   }

  //   .code-input {
  //     margin-bottom: calc(var(--app-margin) * 1.5);
  //     --background: rgba(var(--app-medium-rgb), 0.1);
  //     border-radius: var(--app-border-radius);
  //     --highlight-color: var(--app-primary);

  //     ion-input {
  //       --padding-start: var(--app-padding);
  //       --padding-end: var(--app-padding);
  //       font-size: var(--app-font-size-large);
  //     }

  //     ion-note {
  //       padding: 0 var(--app-padding);
  //       &[color="medium"] {
  //         color: var(--app-medium);
  //       }
  //       &[slot="error"] {
  //         color: var(--app-danger);
  //       }
  //     }
  //   }

  //   .kiosk-button {
  //     margin: calc(var(--app-margin) * 0.5) 0;
  //     height: var(--app-button-height);
  //     --border-radius: var(--app-border-radius);
  //     --background: var(--app-primary);
  //     --color: var(--app-light);
  //     font-size: var(--app-font-size-base);
  //     font-weight: 500;
  //     text-transform: uppercase;
  //     transition: var(--app-transition);

  //     &:hover {
  //       --background: var(--app-secondary);
  //       transform: translateY(-2px);
  //     }

  //     ion-icon {
  //       font-size: 1.5em;
  //       margin-right: var(--app-padding);
  //     }
  //   }

  //   .alternative-methods {
  //     margin-top: calc(var(--app-margin) * 2);
  //     padding-top: calc(var(--app-margin) * 2);
  //     border-top: 2px solid rgba(var(--app-medium-rgb), 0.1);

  //     .kiosk-button {
  //       --background: var(--app-secondary);
  //       &:hover {
  //         --background: var(--app-accent);
  //       }
  //     }
  //   }

  //   ion-modal {
  //     --height: auto;
  //     --width: 90%;
  //     --max-width: 500px;
  //     --border-radius: var(--app-modal-border-radius);
  //     --box-shadow: var(--app-box-shadow);

  //     ion-header ion-toolbar {
  //       --background: var(--app-primary);
  //       --color: var(--app-light);
  //     }

  //     ion-content {
  //       --background: var(--app-light);
  //     }
  //   }
  // `]
})
export class AttendanceKioskPage implements OnInit {
  isAuthenticated = false;
  employeeCode = '';
  isValidCode = false;
  isLoading = false;
  showError = false;
  isQRScannerVisible = false;

  constructor(
    private employeeService: EmployeeService,
    private toastController: ToastController,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.checkAuthentication();
  }

  private checkAuthentication() {
    this.authService.isAuthenticated().subscribe(
      isAuth => this.isAuthenticated = isAuth
    );
  }

  onCodeChange(event: any) {
    const code = event.detail.value?.toUpperCase();
    const codeRegex = /^AEM\d{3}$/;
    this.isValidCode = codeRegex.test(code);
    this.showError = code?.length > 0 && !this.isValidCode;
  }

  async markAttendance(method: AuthMethod) {
    try {
      if (method === 'code' && !this.isValidCode) {
        this.showToast('Digite um código válido', 'warning');
        return;
      }

      const employee = await this.employeeService.findEmployeeByCode(this.employeeCode);
      if (!employee) {
        this.showToast('Funcionário não encontrado', 'danger');
        return;
      }

      const currentTime = new Date().toLocaleTimeString().substring(0, 5);
      const isCheckOut = await this.checkIfCheckOut(employee.id);
      
      const confirmed = await this.showConfirmationModal(employee.name, currentTime, isCheckOut);
      if (!confirmed) return;

      this.isLoading = true;
      await this.employeeService.registerAttendance(this.employeeCode, method);
      
      this.employeeCode = '';
      this.isValidCode = false;

    } catch (error: any) {
      this.showToast(error.message || 'Erro ao registrar ponto', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async checkIfCheckOut(employeeId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const attendance = await this.employeeService.getAttendanceByMonth(
      new Date().getFullYear(),
      new Date().getMonth() + 1
    );
    const todayAttendance = attendance.find(
      a => a.employee_id === employeeId && a.date === today
    );
    return !!todayAttendance?.check_in && !todayAttendance?.check_out;
  }

  private async showConfirmationModal(
    employeeName: string, 
    currentTime: string, 
    isCheckOut: boolean
  ): Promise<boolean> {
    const modal = await this.modalController.create({
      component: AttendanceConfirmationComponent,
      componentProps: {
        employeeName,
        currentTime,
        isCheckOut
      },
      cssClass: 'confirmation-modal'
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();
    return data;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'middle'
    });
    toast.present();
  }

  async goToAdmin() {
    await this.router.navigate(['/login']);
  }

  async logout() {
    await this.authService.logout();
  }

  async showQRScanner() {
    this.isQRScannerVisible = true;
  }

  hideQRScanner() {
    this.isQRScannerVisible = false;
  }

  async onQRCodeScanned(qrData: string) {
    this.hideQRScanner();
    try {
      this.isLoading = true;
      const result = await this.employeeService.registerAttendanceByQRCode(qrData);
      
      // Usar a mensagem personalizada retornada do serviço
      this.showToast(result.message, result.success ? 'success' : 'warning');
      
      if (result.success) {
        // Tocar um som de sucesso ou realizar outras ações necessárias
        this.playSuccessSound();
      }
    } catch (error: any) {
      console.error('QR Code error:', error);
      this.showToast(error.message || 'QR Code inválido', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private playSuccessSound() {
    // Opcional: Implementar som de sucesso
    const audio = new Audio('assets/sounds/success.mp3');
    audio.play().catch(() => console.log('Som não pôde ser reproduzido'));
  }
}

