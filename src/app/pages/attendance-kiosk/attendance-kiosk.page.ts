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
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';

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
  templateUrl: './attendance-kiosk.page.html',
  styleUrls: ['./attendance-kiosk.page.scss'],
  providers: [BarcodeScanner]
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
    private networkService: NetworkService,
    private barcodeScanner: BarcodeScanner
  ) {}
  async scanBarcode() {
    try {
      const barcodeData = await this.barcodeScanner.scan();
      console.log('Barcode data', barcodeData);
      if (barcodeData && barcodeData.text) {
        this.employeeCode = barcodeData.text;
        this.onCodeChange({ detail: { value: barcodeData.text } });
        // Só marca presença se o código for válido
        if (this.isValidCode) {
            await this.markAttendance('code' as AuthMethod);
        } else {
          this.showToast('Código escaneado inválido', 'warning');
        }
      }
    } catch (err) {
      console.log('Error', err);
      this.showToast('Erro ao escanear código de barras', 'danger');
    }
  }

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

