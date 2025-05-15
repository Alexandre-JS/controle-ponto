import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import { IonicModule } from '@ionic/angular';
import { AppQRCodeComponent } from '../components/qr-code/qr-code.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    QRCodeComponent,
    AppQRCodeComponent
  ],
  exports: [QRCodeComponent, AppQRCodeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppQRCodeModule {}
