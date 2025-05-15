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
        [formats]="[BarcodeFormat.QR_CODE]"
        (scanSuccess)="onScanSuccess($event)">
      </zxing-scanner>
    </div>
  `,
  styles: [`
    .scanner-container {
      width: 300px;
      height: 300px;
      margin: 0 auto;
    }
  `]
})
export class QRScannerComponent {
  protected BarcodeFormat = BarcodeFormat;

  @Output() scanComplete: EventEmitter<string> = new EventEmitter<string>();

  onScanSuccess(result: string) {
    try {
      const cleanResult = result.trim();
      console.log('QR Code escaneado:', cleanResult);
      
      // Validar se é um código válido AEM + 3 números
      if (cleanResult.match(/^AEM\d{3}$/)) {
        console.log('Código válido encontrado:', cleanResult);
        this.scanComplete.emit(cleanResult);
      } else {
        console.error('Formato inválido:', cleanResult);
      }
    } catch (error) {
      console.error('Erro ao processar QR code:', error);
    }
  }
}
