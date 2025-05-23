import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ToastController, Platform } from '@ionic/angular';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule, IonicModule],
  template: `
    <div class="scanner-container" [class.has-permission]="hasPermission">
      <zxing-scanner
        *ngIf="!isNativePlatform"
        [formats]="allowedFormats"
        (scanSuccess)="onScanSuccess($event)"
        (permissionResponse)="onPermissionResponse($event)"
        (camerasFound)="onCamerasFound($event)"
        (hasDevices)="onHasDevices($event)"
        [enable]="scannerEnabled">
      </zxing-scanner>

      <div class="scanner-overlay" *ngIf="hasPermission">
        <div class="scan-region"></div>
      </div>
    </div>

    <div *ngIf="hasPermission === false" class="error-container">
      <ion-text color="danger">
        <h2>Acesso à Câmera Necessário</h2>
        <p>Para escanear QR codes, precisamos de permissão para usar sua câmera.</p>
      </ion-text>
      <ion-button expand="block" (click)="requestPermission()">
        <ion-icon name="camera-outline" slot="start"></ion-icon>
        Permitir Câmera
      </ion-button>
    </div>

    <div *ngIf="lastResult" class="result-container">
      <p>Código lido: {{lastResult}}</p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 300px;
      position: relative;
    }

    .scanner-container {
      width: 100%;
      height: 100%;
      min-height: 300px;
      position: relative;
      overflow: hidden;
      border-radius: 12px;
      background: #000;

      &.has-permission {
        border: 2px solid var(--app-primary);
      }

      zxing-scanner {
        width: 100%;
        height: 100%;
        max-height: 100vh;
        object-fit: cover;
        display: block;
      }
    }

    .scanner-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;

      .scan-region {
        width: 250px;
        height: 250px;
        border: 2px solid var(--app-primary);
        border-radius: 12px;
        position: relative;
        box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.5);
        animation: pulse 2s infinite;

        &::before,
        &::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border-color: var(--app-secondary);
          border-style: solid;
        }

        &::before {
          top: -2px;
          left: -2px;
          border-width: 2px 0 0 2px;
        }

        &::after {
          bottom: -2px;
          right: -2px;
          border-width: 0 2px 2px 0;
        }
      }
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .error-container {
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 12px;
      margin: 16px;

      h2 {
        color: var(--app-danger);
        margin-bottom: 8px;
      }

      p {
        margin-bottom: 16px;
        color: var(--app-medium);
      }

      ion-button {
        --background: var(--app-primary);
      }
    }

    .result-container {
      margin-top: 10px;
      text-align: center;
      font-weight: bold;
      padding: 16px;
      background: white;
      border-radius: 12px;
      margin: 16px;
    }
  `]
})
export class QRScannerComponent implements OnInit {
  protected allowedFormats = [BarcodeFormat.QR_CODE];
  protected scannerEnabled = true;
  protected lastResult: string | null = null;
  protected hasPermission: boolean | null = null;
  protected hasDevices: boolean = false;
  protected availableDevices: MediaDeviceInfo[] = [];
  protected isNativePlatform: boolean = Capacitor.isNativePlatform();
  
  @Output() scanComplete: EventEmitter<string> = new EventEmitter<string>();
  
  constructor(
    private toastController: ToastController,
    private platform: Platform
  ) {}

  async ngOnInit() {
    try {
      await this.platform.ready();
      console.log('Plataforma:', this.platform.platforms());
      console.log('É plataforma nativa?', this.isNativePlatform);
      
      await this.initializeCamera();
    } catch (err) {
      console.error('Erro na inicialização:', err);
      this.showErrorMessage('Erro ao inicializar o scanner');
    }
  }

  async initializeCamera() {
    try {
      console.log('Iniciando verificação de permissões da câmera...');
      
      if (this.isNativePlatform) {
        console.log('Usando Capacitor Camera API');
        await this.checkPermissions();
      } else {
        console.log('Usando API Web');
        await this.checkWebPermissions();
      }
    } catch (err) {
      console.error('Erro ao inicializar câmera:', err);
      this.showErrorMessage('Erro ao inicializar câmera');
    }
  }

  async checkWebPermissions() {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      console.log('Status da permissão web:', result.state);
      
      if (result.state === 'granted') {
        this.hasPermission = true;
      } else if (result.state === 'prompt') {
        await this.requestPermission();
      } else {
        this.hasPermission = false;
        this.showErrorMessage('Permissão da câmera negada');
      }
    } catch (err) {
      console.error('Erro ao verificar permissões web:', err);
      this.showErrorMessage('Erro ao verificar permissões');
    }
  }

  async checkPermissions() {
    try {
      console.log('Verificando permissões da câmera...');
      const permission = await Camera.checkPermissions();
      console.log('Status da permissão:', permission.camera);
      
      this.hasPermission = permission.camera === 'granted';
      
      if (!this.hasPermission) {
        console.log('Permissão não concedida, solicitando...');
        await this.requestPermission();
      }
    } catch (err) {
      console.error('Erro ao verificar permissões:', err);
      this.showErrorMessage('Erro ao verificar permissões da câmera');
    }
  }

  async onPermissionResponse(permitted: boolean) {
    console.log('Resposta de permissão:', permitted);
    this.hasPermission = permitted;
    if (!permitted) {
      this.showErrorMessage('Acesso à câmera negado');
    }
  }

  onCamerasFound(devices: MediaDeviceInfo[]) {
    this.availableDevices = devices;
    console.log('Câmeras disponíveis:', devices);
  }

  onHasDevices(has: boolean) {
    this.hasDevices = has;
    console.log('Tem dispositivos?', has);
    if (!has) {
      this.showErrorMessage('Nenhuma câmera encontrada');
    }
  }

  async requestPermission() {
    try {
      console.log('Solicitando permissão da câmera...');
      
      if (this.isNativePlatform) {
        console.log('Solicitando permissão via Capacitor');
        const result = await Camera.requestPermissions();
        console.log('Resultado da solicitação:', result);
        
        this.hasPermission = result.camera === 'granted';
        
        if (this.hasPermission) {
          console.log('Permissão concedida');
          this.scannerEnabled = true;
        } else {
          console.log('Permissão negada');
          this.showErrorMessage('Permissão de câmera necessária');
        }
      } else {
        console.log('Solicitando permissão via Web API');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        this.hasPermission = true;
        this.scannerEnabled = true;
      }
    } catch (err) {
      console.error('Erro ao solicitar permissão da câmera:', err);
      this.showErrorMessage('Não foi possível obter acesso à câmera');
    }
  }

  private async showErrorMessage(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
  
  onScanSuccess(resultString: string) {
    try {
      this.scannerEnabled = false;
      
      const cleanResult = resultString.trim();
      console.log('QR Code escaneado:', cleanResult);
      this.lastResult = cleanResult;
      
      if (cleanResult.match(/^AEM\d{3}$/)) {
        console.log('Código válido encontrado:', cleanResult);
        this.scanComplete.emit(cleanResult);
      } else {
        console.error('Formato inválido:', cleanResult);
        this.showErrorMessage('QR Code inválido');
        setTimeout(() => this.scannerEnabled = true, 2000);
      }
    } catch (err) {
      console.error('Erro ao processar QR code:', err);
      this.showErrorMessage('Erro ao processar QR code');
      setTimeout(() => this.scannerEnabled = true, 2000);
    }
  }
  
  resetScanner() {
    this.lastResult = null;
    this.scannerEnabled = true;
  }
}