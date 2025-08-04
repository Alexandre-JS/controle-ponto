import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { EmployeeService } from '../../services/employee.service';
import { NetworkService } from '../../services/network.service';
import { SyncService } from '../../services/sync.service';

@Component({
  selector: 'app-diagnostics',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Diagnóstico do Sistema</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="runTests()">
            <ion-icon slot="icon-only" name="refresh-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-label>Status da rede</ion-label>
          <ion-badge slot="end" [color]="isOnline ? 'success' : 'danger'">
            {{ isOnline ? 'Online' : 'Offline' }}
          </ion-badge>
        </ion-item>

        <ion-item *ngFor="let test of diagnosticTests">
          <ion-label>
            <h2>{{ test.name }}</h2>
            <p>{{ test.description }}</p>
          </ion-label>
          <ion-badge slot="end" [color]="test.status === 'success' ? 'success' : 
                                       test.status === 'warning' ? 'warning' : 
                                       test.status === 'error' ? 'danger' : 'medium'">
            {{ test.statusText }}
          </ion-badge>
        </ion-item>
      </ion-list>

      <ion-card *ngIf="testResults">
        <ion-card-header>
          <ion-card-title>Resultados Detalhados</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <pre>{{ testResults }}</pre>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class DiagnosticsPage implements OnInit {
  isOnline = false;
  diagnosticTests: any[] = [];
  testResults: string = '';

  constructor(
    private employeeService: EmployeeService,
    private networkService: NetworkService,
    private syncService: SyncService
  ) {}

  ngOnInit() {
    this.networkService.isOnline$.subscribe(online => {
      this.isOnline = online;
    });
    
    this.setupDiagnosticTests();
    this.runTests();
  }

  setupDiagnosticTests() {
    this.diagnosticTests = [
      {
        name: 'Conexão com Supabase',
        description: 'Verifica a conexão com o backend',
        status: 'pending',
        statusText: 'Pendente',
        run: async () => {
          // Implemente a verificação de conexão
        }
      },
      {
        name: 'Teste de registro de presença',
        description: 'Verifica se o registro de presença está funcionando',
        status: 'pending',
        statusText: 'Pendente',
        run: async () => {
          // Implemente um teste simulado de registro
        }
      },
      // Adicione mais testes conforme necessário
    ];
  }

  async runTests() {
    this.testResults = '';
    for (const test of this.diagnosticTests) {
      test.status = 'running';
      test.statusText = 'Executando...';
      try {
        const result = await test.run();
        test.status = result.status;
        test.statusText = result.statusText;
        this.testResults += `${test.name}: ${result.details}\n\n`;
      } catch (error) {
        test.status = 'error';
        test.statusText = 'Erro';
        this.testResults += `${test.name}: ${error}\n\n`;
      }
    }
  }
}
