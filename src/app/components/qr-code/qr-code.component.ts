import { Component, Input } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-qr-code',
  template: `
    <div class="qr-code-wrapper">
      <qrcode
        [qrdata]="value"
        [width]="200"
        [errorCorrectionLevel]="'M'"
        [elementType]="'canvas'">
      </qrcode>
    </div>
  `,
  styles: [`
    .qr-code-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
    }
  `],
  standalone: true,
  imports: [QRCodeComponent]
})
export class AppQRCodeComponent {
  @Input() value: string = '';
  @Input() cssClass: string = '';
}
