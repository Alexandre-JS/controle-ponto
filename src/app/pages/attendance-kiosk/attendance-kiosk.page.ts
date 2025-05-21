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
  styles: [`
    .attendance-kiosk {
      --background: var(--ion-color-light);
    }
    .kiosk-container {
      max-width: 500px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1, h2 {
      font-weight: bold;
      margin: 1rem 0;
    }
    .kiosk-buttons {
      margin-top: 3rem;
    }
    .code-input {
      margin-bottom: 2rem;
      --background: var(--ion-color-light);
      border-radius: 8px;
    }
    .kiosk-button {
      margin: 1rem 0;
      height: 60px;
      --border-radius: 8px;
      font-size: 1.2rem;
    }
    .alternative-methods {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--ion-color-light);
    }
    .login-required {
      max-width: 400px;
      margin: 4rem auto;
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);

      ion-icon {
        font-size: 64px;
        color: var(--ion-color-medium);
        margin-bottom: 1rem;
      }

      h2 {
        color: var(--ion-color-dark);
        margin-bottom: 1rem;
      }

      p {
        color: var(--ion-color-medium);
        margin-bottom: 2rem;
      }

      ion-button {
        margin-top: 1rem;
      }
    }
    .admin-button {
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 100;
    }
  `]
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

