import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { NetworkService } from '../../services/network.service';
import { AttendanceConfirmationComponent } from '../../components/attendance-confirmation/attendance-confirmation.component';
import { QRScannerComponent } from '../../components/qr-scanner/qr-scanner.component';
import { QRScannerModule } from '../../components/qr-scanner/qr-scanner.module';
import { AuthMethod } from '../../services/employee.service';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

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
    QRScannerModule,
    AppHeaderComponent
  ],
  template: `
    <app-header
      title="Registro de Ponto"
      icon="stopwatch-outline"
      [showMenu]="false"
      [showNotifications]="false"
      [showThemeToggle]="true">
      <ion-buttons slot="end">
        <ion-button (click)="goToAdmin()">
          <ion-icon slot="start" name="settings-outline"></ion-icon>
          Gerenciar Sistema
        </ion-button>
      </ion-buttons>
    </app-header>

    <ion-content class="ion-padding attendance-kiosk">
      <div class="kiosk-container app-card">
        <h1 class="ion-text-center text-heading">IDENTIFIQUE-SE PARA</h1>
        <h2 class="ion-text-center text-heading">MARCAR PRESENÇA</h2>

        <div class="kiosk-buttons">
          <ion-item class="code-input form-item">
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

          <!-- <ion-item class="name-search">
            <ion-input
              [(ngModel)]="searchName"
              (ionChange)="onNameSearch($event)"
              placeholder="Ou busque pelo nome do funcionário"
              type="text">
            </ion-input>
          </ion-item> -->

          <!-- <ion-item class="name-search">
  <ion-select
    [(ngModel)]="searchName"
    (ionChange)="onNameSearch($event)"
    placeholder="Ou busque pelo nome do funcionário"
    interface="popover"
    cancelText="Cancelar"
    okText="Selecionar">
    <ion-select-option *ngFor="let employee of filteredEmployees" [value]="employee.internal_code">
      {{ employee.name }}
    </ion-select-option>
  </ion-select>
</ion-item> -->

          <ion-list *ngIf="showEmployeeList && filteredEmployees.length > 0" class="employee-list">
            <ion-item button *ngFor="let employee of filteredEmployees" (click)="selectEmployee(employee)">
              <ion-label>{{employee.name}}</ion-label>
              <ion-note slot="end" color="medium">{{employee.internal_code}}</ion-note>
            </ion-item>
          </ion-list>

          <ion-button expand="block"
                      class="kiosk-button app-button"
                      (click)="markAttendance('code')"
                      [disabled]="!isValidCode">
            <ion-icon name="log-in-outline" slot="start" size="large"></ion-icon>
            MARCAR PONTO
          </ion-button>

          <div class="alternative-methods">
            <ion-button expand="block"
                      class="kiosk-button app-button-secondary"
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
      --background: var(--app-neutral-light);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--app-padding);
    }

    .kiosk-container {
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
      padding: calc(var(--app-padding) * 2);
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(var(--app-primary-rgb), 0.15);
    }

    h1, h2 {
      font-weight: bold;
      color: var(--app-primary);
      text-align: center;
      margin: 0;
    }

    h1 {
      font-size: 24px;
      margin-bottom: 0.5rem;
    }

    h2 {
      font-size: 18px;
      color: var(--app-secondary);
      margin-bottom: 2rem;
    }

    .kiosk-buttons {
      margin-top: 24px;
    }

    .code-input, .name-search {
      margin-bottom: 16px;
      --background: rgba(var(--app-medium-rgb), 0.1);
      border-radius: 12px;
      --highlight-color: var(--app-primary);

      ion-input {
        --padding-start: 16px;
        --padding-end: 16px;
        font-size: 18px;
      }

      ion-note {
        padding: 0 16px;
        &[color="medium"] {
          color: var(--app-medium);
        }
        &[slot="error"] {
          color: var(--app-danger);
        }
      }
    }

    .employee-list {
      margin-top: -8px;
      margin-bottom: 16px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(var(--app-primary-rgb), 0.1);

      ion-item {
        --padding-start: 16px;
        --padding-end: 16px;
        --background: white;
        --border-color: rgba(var(--app-medium-rgb), 0.1);

        &:hover {
          --background: rgba(var(--app-primary-rgb), 0.05);
        }

        ion-label {
          font-size: 16px;
          color: var(--app-primary);
        }

        ion-note {
          font-size: 14px;
          color: var(--app-medium);
        }
      }
    }
    .name-search {
  ion-select {
    width: 100%;
    max-width: 100%;
    --padding-start: 16px;
    --padding-end: 16px;
    font-size: 18px;
  }

  ion-select::part(text) {
    color: var(--ion-color-medium);
  }
}

    .kiosk-button {
      margin: 8px 0;
      height: 48px;
      --border-radius: 12px;
      --background: var(--app-primary);
      --color: white;
      font-size: 16px;
      font-weight: 500;
      text-transform: uppercase;
      transition: all 0.2s ease;

      &:hover {
        --background: var(--app-secondary);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(var(--app-primary-rgb), 0.3);
      }

      ion-icon {
        font-size: 24px;
        margin-right: 12px;
      }
    }

    .alternative-methods {
      margin-top: 32px;
      padding-top: 32px;
      border-top: 2px solid rgba(var(--app-medium-rgb), 0.1);

      .kiosk-button {
        --background: var(--app-secondary);
        &:hover {
          --background: var(--app-accent);
          box-shadow: 0 4px 8px rgba(var(--app-secondary-rgb), 0.3);
        }
      }
    }

    ion-modal {
      --height: auto;
      --width: 90%;
      --max-width: 500px;
      --border-radius: 16px;
      --box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

      ion-header ion-toolbar {
        --background: var(--app-primary);
        --color: white;
      }

      ion-content {
        --background: white;
      }
    }

    ion-toolbar {
      --background: var(--app-primary);
      --color: var(--app-primary-contrast);
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
  searchName = '';
  filteredEmployees: any[] = [];
  showEmployeeList = false;
  isProcessing = false; // Flag para controlar o processamento de registro de ponto

  constructor(
    private employeeService: EmployeeService,
    private toastController: ToastController,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private modalController: ModalController,
    private networkService: NetworkService
  ) {}

  async ngOnInit() {
    this.checkAuthentication();
    await this.loadEmployees();
  }

  private checkAuthentication() {
    this.authService.isAuthenticated().subscribe(
      isAuth => this.isAuthenticated = isAuth
    );
  }

  private async loadEmployees() {
    try {
      const employees = await this.employeeService.getEmployees();
      this.filteredEmployees = employees.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      this.showToast('Erro ao carregar lista de funcionários', 'danger');
    }
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

      // Exibir indicador de carregamento
      this.isProcessing = true;

      const employee = await this.employeeService.findEmployeeByCode(this.employeeCode);
      if (!employee) {
        // Mensagem mais específica para modo offline
        if (!this.networkService.isOnline()) {
          this.showToast('Funcionário não encontrado no cache local. Verifique o código ou conecte-se à internet.', 'danger');
        } else {
          this.showToast('Funcionário não encontrado. Verifique o código inserido.', 'danger');
        }
        this.isProcessing = false;
        return;
      }

      const currentTime = new Date().toLocaleTimeString().substring(0, 5);
      const isCheckOut = await this.checkIfCheckOut(employee.id);

      const confirmed = await this.showConfirmationModal(employee.name, currentTime, isCheckOut);
      if (!confirmed) {
        this.isProcessing = false;
        return;
      }

      this.isLoading = true;
      await this.employeeService.registerAttendance(this.employeeCode, method);

      // Verificar status da rede para mostrar mensagem apropriada
      const isOffline = !this.networkService.isOnline();
      if (isOffline) {
        this.showToast(
          'Registro realizado localmente com sucesso! Será sincronizado quando houver conexão.',
          'success',
          5000
        );
      } else {
        this.showToast('Registro realizado com sucesso!', 'success');
      }

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

  private async showToast(message: string, color: string, duration: number = 2000) {
    const toast = await this.toastController.create({
      message,
      duration: duration,
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

  async onNameSearch(event: any) {
    const selectedCode = event.detail.value;
    if (selectedCode) {
      this.employeeCode = selectedCode;
      this.isValidCode = true;
      const selectedEmployee = this.filteredEmployees.find(emp => emp.internal_code === selectedCode);
      if (selectedEmployee) {
        await this.markAttendance('code');
        this.searchName = ''; // Clear the search field after registration
      }
    }
  }
  selectEmployee(employee: any) {
    this.employeeCode = employee.internal_code;
    this.searchName = '';
    this.showEmployeeList = false;
    this.filteredEmployees = [];
    this.isValidCode = true;
  }

  private playSuccessSound() {
    // Opcional: Implementar som de sucesso
    const audio = new Audio('assets/sounds/success.mp3');
    audio.play().catch(() => console.log('Som não pôde ser reproduzido'));
  }
}

