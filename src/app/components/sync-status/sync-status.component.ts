import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { SyncService, SyncStats } from '../../services/sync.service';
import { NetworkService } from '../../services/network.service';
import { CacheService } from '../../services/cache.service';
import { Subscription, combineLatest } from 'rxjs';

@Component({
  selector: 'app-sync-status',
  templateUrl: './sync-status.component.html',
  styleUrls: ['./sync-status.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class SyncStatusComponent implements OnInit, OnDestroy {
  isOnline = false;
  isSyncing = false;
  lastSync: Date | null = null;
  syncError: string | null = null;
  pendingSyncCount = 0;
  unsyncedItems: { [key: string]: number } = {};
  syncStats: SyncStats = {
    lastSync: null,
    pendingItems: 0,
    successCount: 0,
    errorCount: 0
  };
  
  private subscriptions: Subscription[] = [];

  constructor(
    private syncService: SyncService,
    private networkService: NetworkService,
    private cacheService: CacheService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.subscribeToServices();
    this.updateSyncStatus();
    
    // Verificar periodicamente se a sincronização está travada
    this.checkStuckSyncInterval = setInterval(() => this.checkStuckSync(), 30000);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.checkStuckSyncInterval) {
      clearInterval(this.checkStuckSyncInterval);
    }
  }

  private subscribeToServices() {
    // Status da rede
    this.subscriptions.push(
      this.networkService.isOnline$.subscribe(isOnline => {
        this.isOnline = isOnline;
      })
    );

    // Status de sincronização
    this.subscriptions.push(
      combineLatest([
        this.syncService.isSyncing$,
        this.syncService.lastSync$,
        this.syncService.syncError$,
        this.syncService.syncStats$
      ]).subscribe(([isSyncing, lastSync, syncError, syncStats]) => {
        this.isSyncing = isSyncing;
        this.lastSync = lastSync;
        this.syncError = syncError;
        this.syncStats = syncStats;
        this.pendingSyncCount = syncStats.pendingItems;
        
        // Atualizar status quando qualquer coisa mudar
        this.updateSyncStatus();
      })
    );
  }

  private updateSyncStatus() {
    this.pendingSyncCount = this.syncService.getPendingSyncCount();
    this.unsyncedItems = this.syncService.getUnsyncedItemsCount();
  }

  async forcSync() {
    try {
      await this.syncService.forcSync();
      this.updateSyncStatus();
    } catch (error) {
      console.error('Erro na sincronização forçada:', error);
    }
  }

  async syncOnlyUploads() {
    try {
      await this.syncService.syncOnlyUploads();
      this.updateSyncStatus();
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  }

  getStatusColor(): string {
    if (!this.isOnline) return 'medium';
    if (this.isSyncing) return 'warning';
    if (this.syncError) return 'danger';
    if (this.pendingSyncCount > 0) return 'warning';
    return 'success';
  }

  getStatusText(): string {
    if (!this.isOnline) return 'Offline';
    if (this.isSyncing) return 'Sincronizando...';
    if (this.syncError) return 'Erro na sincronização';
    if (this.pendingSyncCount > 0) return `${this.pendingSyncCount} itens pendentes`;
    return 'Sincronizado';
  }

  getLastSyncText(): string {
    if (!this.lastSync) return 'Nunca sincronizado';
    
    const now = new Date();
    const diffMs = now.getTime() - this.lastSync.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  }

  getStatusIcon(): string {
    if (!this.isOnline) return 'cloud-offline-outline';
    if (this.isSyncing) return 'sync-outline';
    if (this.syncError) return 'alert-circle-outline';
    if (this.pendingSyncCount > 0) return 'cloud-upload-outline';
    return 'checkmark-circle-outline';
  }

  getUnsyncedItemsList(): Array<{label: string, count: number}> {
    const typeLabels: { [key: string]: string } = {
      employee: 'Funcionários',
      attendance: 'Presenças',
      work_schedule: 'Horários',
      schedule: 'Agendas',
      record: 'Registros'
    };

    return Object.entries(this.unsyncedItems)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        label: typeLabels[type] || type,
        count
      }));
  }
  
  getSyncStats(): string {
    const { successCount, errorCount } = this.syncStats;
    
    if (successCount === 0 && errorCount === 0) {
      return '';
    }
    
    if (errorCount > 0) {
      return `${successCount} sucesso, ${errorCount} falhas`;
    }
    
    return `${successCount} itens sincronizados`;
  }

  dismissError() {
    this.syncError = null;
  }
  
  // Intervalo para verificar sincronização travada
  private checkStuckSyncInterval: any;
  
  /**
   * Verifica se o status de sincronização está travado e o reseta se necessário
   */
  private checkStuckSync() {
    if (!this.isSyncing) return;
    
    // Se está sincronizando há mais de 2 minutos, provavelmente travou
    const twoMinutesAgo = new Date();
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
    
    const lastSyncTime = this.lastSync || new Date(0);
    
    if (this.isSyncing && lastSyncTime < twoMinutesAgo) {
      console.warn('Sincronização parece estar travada, resetando estado...');
      
      // Acionar método para resetar estado de sincronização
      this.syncService['isSyncingSubject'].next(false);
      
      // Atualizar a interface
      this.isSyncing = false;
      this.updateSyncStatus();
    }
  }
  
  /**
   * Identificar se temos um grande acúmulo de sincronização
   * @returns true se há um acúmulo significativo
   */
  hasLargeSyncBacklog(): boolean {
    return this.pendingSyncCount > 200; // Consideramos mais de 200 itens como um grande acúmulo
  }
  
  /**
   * Limpa itens antigos da fila de sincronização (mais de 7 dias)
   * Útil quando há um grande acúmulo
   */
  async clearOldSyncItems() {
    if (!this.isOnline || this.isSyncing) return;
    
    const removedCount = this.syncService.cleanupSyncQueue(7);
    
    // Mostrar feedback
    if (removedCount > 0) {
      this.showToast(`${removedCount} itens antigos removidos da fila de sincronização`);
      this.updateSyncStatus();
    } else {
      this.showToast('Nenhum item antigo encontrado na fila');
    }
  }
  
  /**
   * Tenta resolver um grande acúmulo de sincronização
   * sincronizando em pequenos lotes
   */
  async resolveBacklog() {
    if (!this.isOnline || this.isSyncing) return;
    
    this.showToast('Processando itens pendentes em lotes. Isso pode demorar um pouco...');
    
    try {
      const result = await this.syncService.resolveSyncBacklog();
      this.updateSyncStatus();
      
      this.showToast(`${result.success} itens sincronizados, ${result.error} erros, ${result.remaining} itens restantes`);
      
      // Se ainda tem muitos itens, sugerir continuar
      if (result.remaining > 100) {
        this.showToast('Continue clicando em "Resolver acúmulo" para processar mais itens', 'medium', 5000);
      }
    } catch (error) {
      this.showToast('Erro ao processar itens pendentes', 'danger');
      console.error('Erro ao resolver acúmulo:', error);
    }
  }
  
  /**
   * Exibe informações de diagnóstico sobre a fila de sincronização
   */
  showSyncQueueDiagnostic() {
    const diagnostic = this.syncService.diagnosticSyncQueue();
    
    // Formatar as datas para display
    const oldestDate = diagnostic.oldestItem 
      ? new Date(diagnostic.oldestItem).toLocaleDateString() 
      : 'N/A';
      
    const newestDate = diagnostic.newestItem 
      ? new Date(diagnostic.newestItem).toLocaleDateString() 
      : 'N/A';
    
    // Formatar os tipos para display
    const typeInfo = Object.entries(diagnostic.byType)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
    
    // Formatar as ações para display
    const actionInfo = Object.entries(diagnostic.byAction)
      .map(([action, count]) => `${action}: ${count}`)
      .join(', ');
    
    // Montar mensagem de diagnóstico
    const message = `
      Total: ${diagnostic.totalItems} itens
      Tipos: ${typeInfo}
      Ações: ${actionInfo}
      Itens com retentativas: ${diagnostic.retryStats.withRetries}
      Máximo de retentativas: ${diagnostic.retryStats.maxRetries}
      Item mais antigo: ${oldestDate}
      Item mais recente: ${newestDate}
    `;
    
    console.info('Diagnóstico da fila de sincronização:', diagnostic);
    
    // Mostrar alerta com as informações
    this.showDiagnosticAlert('Diagnóstico da Sincronização', message);
  }
  
  /**
   * Exibe um toast com mensagem para o usuário
   */
  private async showToast(message: string, color: string = 'success', duration: number = 3000) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'bottom',
      color,
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }
  
  /**
   * Exibe um alerta com informações detalhadas
   */
  private async showDiagnosticAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
  
  // Ações para lidar com falhas de sincronização
  async showSyncFailureDetails() {
    const syncStats = this.syncStats;
    const errorCount = syncStats.errorCount;
    
    if (errorCount <= 0) return;
    
    const alert = await this.alertController.create({
      header: `${errorCount} Falhas de Sincronização`,
      message: `
        <p>Foram encontradas ${errorCount} falhas durante a sincronização.</p>
        <p>Isso pode acontecer quando:</p>
        <ul>
          <li>Dados dependentes (funcionários) não existem no servidor</li>
          <li>Problemas temporários de conexão com o servidor</li>
          <li>Conflitos entre dados locais e remotos</li>
        </ul>
        <p>O que deseja fazer?</p>
      `,
      buttons: [
        {
          text: 'Ignorar',
          role: 'cancel'
        },
        {
          text: 'Tentar Novamente',
          handler: () => {
            this.forcSync();
          }
        },
        {
          text: 'Sincronização Avançada',
          handler: () => {
            this.showAdvancedSyncOptions();
          }
        }
      ]
    });

    await alert.present();
  }
  
  // Opções avançadas de sincronização para recuperação de falhas
  async showAdvancedSyncOptions() {
    const alert = await this.alertController.create({
      header: 'Opções Avançadas de Sincronização',
      message: `
        <p>Selecione uma das opções abaixo para resolver problemas de sincronização:</p>
      `,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sincronização Gradual',
          handler: () => {
            this.syncInBatches();
          }
        },
        {
          text: 'Sincronizar Funcionários',
          handler: () => {
            this.syncOnlyEmployees();
          }
        },
        {
          text: 'Baixar Funcionários',
          handler: () => {
            this.refreshEmployees();
          }
        },
        {
          text: 'Reiniciar Cliente',
          handler: () => {
            this.reinitializeSupabase();
          }
        }
      ]
    });

    await alert.present();
  }
  
  // Métodos de recuperação
  
  async syncInBatches() {
    const toast = await this.toastController.create({
      message: 'Iniciando sincronização em lotes...',
      duration: 2000
    });
    await toast.present();
    
    try {
      await this.syncService.syncInBatches();
    } catch (error) {
      console.error('Erro na sincronização em lotes:', error);
    }
  }
  
  async syncOnlyEmployees() {
    const toast = await this.toastController.create({
      message: 'Sincronizando apenas funcionários...',
      duration: 2000
    });
    await toast.present();
    
    try {
      await this.syncService.syncOnlyEmployees();
    } catch (error) {
      console.error('Erro ao sincronizar funcionários:', error);
    }
  }
  
  async refreshEmployees() {
    const toast = await this.toastController.create({
      message: 'Baixando dados de funcionários...',
      duration: 2000
    });
    await toast.present();
    
    try {
      await this.syncService.refreshEmployees();
    } catch (error) {
      console.error('Erro ao baixar funcionários:', error);
    }
  }
  
  async reinitializeSupabase() {
    const toast = await this.toastController.create({
      message: 'Reinicializando cliente Supabase...',
      duration: 2000
    });
    await toast.present();
    
    try {
      await this.syncService.reinitializeSupabaseClient();
      await this.forcSync();
    } catch (error) {
      console.error('Erro ao reinicializar cliente:', error);
    }
  }
}
