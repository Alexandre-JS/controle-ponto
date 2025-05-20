import { Component, EventEmitter, Output } from '@angular/core';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule],
  template: `
    <div class="scanner-container">
      <zxing-scanner
        [formats]="allowedFormats"
        (scanSuccess)="onScanSuccess($event)"
        [enable]="scannerEnabled">
      </zxing-scanner>
    </div>
    <div *ngIf="lastResult" class="result-container">
      <p>Código lido: {{lastResult}}</p>
    </div>
  `,
  styles: [`
    .scanner-container {
      width: 300px;
      height: 300px;
      margin: 0 auto;
    }
    .result-container {
      margin-top: 10px;
      text-align: center;
      font-weight: bold;
    }
  `]
})
export class QRScannerComponent {
  protected allowedFormats = [BarcodeFormat.QR_CODE];
  protected scannerEnabled = true;
  protected lastResult: string | null = null;
  
  @Output() scanComplete: EventEmitter<string> = new EventEmitter<string>();
  
  onScanSuccess(resultString: string) {
    try {
      // Desabilitar temporariamente o scanner para evitar múltiplas leituras
      this.scannerEnabled = false;
      
      const cleanResult = resultString.trim();
      console.log('QR Code escaneado:', cleanResult);
      this.lastResult = cleanResult;
      
      // Validar se é um código válido AEM + 3 números
      if (cleanResult.match(/^AEM\d{3}$/)) {
        console.log('Código válido encontrado:', cleanResult);
        this.scanComplete.emit(cleanResult);
      } else {
        console.error('Formato inválido:', cleanResult);
        // Reativar o scanner após um tempo para permitir nova leitura
        setTimeout(() => this.scannerEnabled = true, 2000);
      }
    } catch (error) {
      console.error('Erro ao processar QR code:', error);
      // Reativar o scanner em caso de erro
      setTimeout(() => this.scannerEnabled = true, 2000);
    }
  }
  
  // Método para reativar o scanner (pode ser chamado pelo componente pai)
  resetScanner() {
    this.lastResult = null;
    this.scannerEnabled = true;
  }
}