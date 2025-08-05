import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
// @ts-ignore
import packageJson from '../../../../package.json';

@Component({
  selector: 'app-sidebar-changelog',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="changelog-footer ion-padding">
      <div class="version" (click)="openChangelogModal()" style="cursor:pointer;">
        Versão: {{ version }} <ion-icon name="information-circle-outline" style="vertical-align:middle;"></ion-icon>
      </div>
    </div>
  `,
  styles: [`
    .changelog-footer {
      font-size: 0.9em;
      color: #666;
      border-top: 1px solid #eee;
      margin-top: 2em;
      text-align: center;
    }
    .version {
      font-weight: bold;
      margin-bottom: 0.5em;
      user-select: none;
    }
    .version:hover {
      color: #222;
      text-decoration: underline;
    }
  `]
})
export class SidebarChangelogComponent {
  version = packageJson.version;
  changelog = [
    'Correção: registro de ponto via QR code',
    'Removido cache local, tudo via Supabase',
    'Novo relatório detalhado de presença',
    'Melhoria: edição de registros pelo admin',
    'Sidebar mostra changelog e versão'
  ];

  constructor(private modalController: ModalController) {}

  async openChangelogModal() {
    const modal = await this.modalController.create({
      component: ChangelogModalComponent,
      componentProps: {
        version: this.version,
        changelog: this.changelog
      },
      cssClass: 'changelog-modal'
    });
    await modal.present();
  }
}

@Component({
  selector: 'app-changelog-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Versão {{ version }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="changelog-title">Últimas atualizações:</div>
      <ul class="changelog-list">
        <li *ngFor="let item of changelog">{{ item }}</li>
      </ul>
    </ion-content>
  `,
  styles: [`
    .changelog-title {
      font-size: 1.1em;
      margin-bottom: 0.5em;
      font-weight: bold;
    }
    .changelog-list {
      padding-left: 1em;
      margin: 0;
    }
    .changelog-list li {
      margin-bottom: 0.4em;
    }
  `]
})
export class ChangelogModalComponent {
  version!: string;
  changelog!: string[];

  constructor(private modalController: ModalController) {}

  close() {
    this.modalController.dismiss();
  }
}
