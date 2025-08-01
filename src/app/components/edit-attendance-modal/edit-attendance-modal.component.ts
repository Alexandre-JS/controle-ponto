import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController, NavParams } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-attendance-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Editar Registro de Presença</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="stacked">Data</ion-label>
        <ion-input type="text" [value]="attendance.date | date:'dd/MM/yyyy'" readonly></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Funcionário</ion-label>
        <ion-input type="text" [value]="attendance.employeeName" readonly></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Horário de Entrada</ion-label>
        <ion-input type="time" [(ngModel)]="attendance.check_in"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Horário de Saída</ion-label>
        <ion-input type="time" [(ngModel)]="attendance.check_out"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Minutos de Atraso</ion-label>
        <ion-input type="number" [(ngModel)]="attendance.late_minutes"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label>Falta</ion-label>
        <ion-checkbox [(ngModel)]="attendance.isAbsence"></ion-checkbox>
      </ion-item>

      <div class="ion-padding-top">
        <ion-button expand="block" (click)="saveChanges()">
          Salvar Alterações
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
      margin-bottom: 16px;
    }
  `]
})
export class EditAttendanceModalComponent implements OnInit {
  attendance: any;

  constructor(
    private modalController: ModalController,
    private navParams: NavParams
  ) {}

  ngOnInit() {
    this.attendance = { ...this.navParams.get('attendance') };
  }

  dismiss() {
    this.modalController.dismiss();
  }

  saveChanges() {
    this.modalController.dismiss({
      attendance: this.attendance,
      changed: true
    });
  }
}
