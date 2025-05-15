import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { QRScannerComponent } from './qr-scanner.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    ZXingScannerModule,
    QRScannerComponent
  ],
  exports: [QRScannerComponent]
})
export class QRScannerModule {}
