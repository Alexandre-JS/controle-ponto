import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { switchMap, catchError, tap, debounceTime } from 'rxjs/operators';
import { LocalStorageService } from './local-storage.service';
// import { NetworkService } from './network.service';
import { NetworkService } from './network.service';
import { SupabaseService } from './supabase.service';
import { SyncQueueItem, ScheduleData, DailyRecord } from '../models/schedule.model';
import { Employee, Attendance, WorkSchedule } from '../models/employee.model';
import { environment } from '../../environments/environment';

export interface SyncStats {
  lastSync: Date | null;
  pendingItems: number;
  successCount: number;
  errorCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private isSyncingSubject = new BehaviorSubject<boolean>(false);
  private lastSyncSubject = new BehaviorSubject<Date | null>(null);
  private syncErrorSubject = new BehaviorSubject<string | null>(null);
  private syncStatsSubject = new BehaviorSubject<SyncStats>({
    lastSync: null,
    pendingItems: 0,
    successCount: 0,
    errorCount: 0
  });
  
  // Controle de tentativas para exponential backoff
  private syncRetryAttempts = 0;
  private maxRetryAttempts = 5;
  
  constructor(
    private localStorageService: LocalStorageService,
    private networkService: NetworkService,
    private supabaseService: SupabaseService
  ) {
    this.startAutoSync();
    this.loadLastSyncTime();
    this.updateSyncStats();
    this.setupNetworkListeners();
  }

  get isSyncing$(): Observable<boolean> {
    return this.isSyncingSubject.asObservable();
  }

  get lastSync$(): Observable<Date | null> {
    return this.lastSyncSubject.asObservable();
  }

  get syncError$(): Observable<string | null> {
    return this.syncErrorSubject.asObservable();
  }
  
  get syncStats$(): Observable<SyncStats> {
    return this.syncStatsSubject.asObservable();
  }

  private setupNetworkListeners(): void {
    this.networkService.isOnline$.pipe(
      // Aguardar um pouco para garantir que a conexão está estável
      debounceTime(2000)
    ).subscribe((isOnline: boolean) => {
      if (isOnline) {
        // Quando voltar a ficar online, verificar se há itens pendentes
        const pendingCount = this.getPendingSyncCount();
        if (pendingCount > 0) {
          console.log(`Conexão restaurada. Sincronizando ${pendingCount} itens pendentes...`);
          this.syncAll().catch(error => {
            console.warn('Erro ao sincronizar após reconexão:', error);
          });
        } else {
          console.log('Conexão restaurada, sem itens pendentes.');
        }
      }
    });
  }

  async syncAll(): Promise<void> {
    if (!this.networkService.isOnline()) {
      this.syncErrorSubject.next('Não há conexão com a internet');
      throw new Error('Não há conexão com a internet');
    }

    // Verificar se já está sincronizando
    if (this.isSyncingSubject.value) {
      console.log('Sincronização já em andamento');
      return;
    }

    this.isSyncingSubject.next(true);
    this.syncErrorSubject.next(null);
    
    try {
      console.log('Iniciando sincronização...');
      
      // 0. Verificar conexão com Supabase antes de prosseguir
      try {
        // Diagnosticar conexão
        const diagnosis = await this.supabaseService.diagnoseConnection();
        if (diagnosis.status !== 'ok') {
          console.warn('Problemas com a conexão Supabase:', diagnosis);
          
          // Se encontrarmos erro 406, reinicializar o cliente Supabase
          if (diagnosis.error && diagnosis.error.includes('406')) {
            console.log('Detectado erro 406, reinicializando cliente Supabase...');
            this.supabaseService.reinitializeClient();
            
            // Tentar novamente após reinicialização
            const retryDiagnosis = await this.supabaseService.diagnoseConnection();
            if (retryDiagnosis.status !== 'ok') {
              throw new Error(`Erro persistente na conexão Supabase após reinicialização: ${retryDiagnosis.error}`);
            }
            console.log('Cliente Supabase reinicializado com sucesso');
          } else {
            throw new Error(`Erro na conexão Supabase: ${diagnosis.error}`);
          }
        }
      } catch (connError) {
        console.error('Falha na verificação da conexão:', connError);
        // Continue mesmo com erro de diagnóstico, tentar sincronizar de qualquer forma
      }
      
      // 1. Enviar dados locais para o servidor
      await this.uploadLocalChanges();
      
      // 2. Baixar dados atualizados do servidor
      await this.downloadServerData();
      
      // 3. Limpar fila de sincronização vazia (itens individuais são removidos em processSyncItem)
      if (this.getPendingSyncCount() === 0) {
        this.localStorageService.clearSyncQueue();
      }
      
      // 4. Atualizar timestamp da última sincronização
      const now = new Date();
      this.localStorageService.setLastSyncTimestamp();
      this.lastSyncSubject.next(now);
      
      // 5. Resetar contador de tentativas após sincronização bem-sucedida
      this.syncRetryAttempts = 0;
      
      console.log('Sincronização concluída com sucesso');
      this.updateSyncStats();
    } catch (error) {
      console.error('Erro durante sincronização:', error);
      this.syncErrorSubject.next(error instanceof Error ? error.message : 'Erro desconhecido');
      
      // Verificar se o erro está relacionado com "406 Not Acceptable"
      const errorString = String(error);
      if (errorString.includes('406') || errorString.includes('Not Acceptable')) {
        console.log('Detectado erro 406, reinicializando cliente Supabase...');
        this.supabaseService.reinitializeClient();
      }
      
      // Incrementar tentativas para backoff
      this.syncRetryAttempts++;
      
      this.updateSyncStats();
      throw error;
    } finally {
      // Garantir que o estado de sincronização seja resetado mesmo em caso de erro
      this.isSyncingSubject.next(false);
    }
  }

  private async uploadLocalChanges(): Promise<void> {
    const queue = this.localStorageService.getSyncQueue();
    console.log(`Processando ${queue.length} itens na fila de sincronização`);
    
    // Se não há itens na fila, retornar imediatamente
    if (queue.length === 0) {
      return;
    }
    
    const results = { success: 0, error: 0 };
    
    // Primeiro, ordenar os itens da fila para processar em ordem mais eficiente:
    // 1. Funcionários primeiro (employees)
    // 2. Depois horários (work_schedule)
    // 3. Por fim presenças (attendance) e outros
    const sortedQueue = [...queue].sort((a, b) => {
      const typeOrder: {[key: string]: number} = { 'employee': 0, 'work_schedule': 1 };
      const orderA = a.type in typeOrder ? typeOrder[a.type] : 99;
      const orderB = b.type in typeOrder ? typeOrder[b.type] : 99;
      return orderA - orderB;
    });
    
    console.log(`Fila reordenada para priorizar dados fundamentais (funcionários primeiro)`);
    
    // Processar em lotes para evitar sobrecarga
    const BATCH_SIZE = 20; // Processar em lotes de 20 itens
    
    for (let i = 0; i < sortedQueue.length; i += BATCH_SIZE) {
      const batch = sortedQueue.slice(i, i + BATCH_SIZE);
      console.log(`Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(sortedQueue.length / BATCH_SIZE)} (${batch.length} itens)`);
      
      // Processar itens do lote
      for (const item of batch) {
        // Definir um timeout para cada operação de item
        let timeoutId: any = null;
        const timeoutPromise = new Promise<void>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Timeout ao processar item ${item.type}:${item.id}`));
          }, 15000); // 15 segundos de timeout
        });
        
        try {
          // Processar o item com timeout competindo contra a execução real
          await Promise.race([
            this.processSyncItem(item),
            timeoutPromise
          ]);
          
          // Se chegou aqui, significa que funcionou
          clearTimeout(timeoutId);
          this.localStorageService.removeSyncQueueItem(item.id);
          results.success++;
        } catch (error) {
          clearTimeout(timeoutId);
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Erro ao sincronizar item ${item.type}:${item.id}:`, errorMessage);
          results.error++;
          
          // Diagnosticar o tipo específico de erro para tratamento adequado
          const isNetworkError = !this.networkService.isOnline() || 
                               errorMessage.includes('network') || 
                               errorMessage.includes('conexão');
          const isAuthError = errorMessage.includes('401') || errorMessage.includes('403');
          const isServerError = errorMessage.includes('500') || errorMessage.includes('503');
          const isDependencyError = errorMessage.includes('relacionados não encontrados');
          
          // Implementar retry logic com incremento de contador
          item.retryCount = (item.retryCount || 0) + 1;
          
          // Limites diferentes de tentativas baseados no tipo de erro
          const maxRetries = isNetworkError ? 5 : 
                            isServerError ? 4 : 
                            isDependencyError ? 5 : 3;
          
          if (item.retryCount >= maxRetries) {
            console.warn(`Item ${item.type}:${item.id} removido após ${item.retryCount} tentativas. Motivo: ${errorMessage}`);
            this.localStorageService.removeSyncQueueItem(item.id);
            
            // Para erros de autenticação, tentar reinicializar o cliente Supabase
            if (isAuthError) {
              console.log('Detectado problema de autenticação, reinicializando cliente...');
              this.supabaseService.reinitializeClient();
            }
          } else {
            // Atualizar o item na fila com o contador incrementado
            this.localStorageService.updateSyncQueueItem(item);
            
            // Para erros de dependência, aguardar um pouco mais antes de continuar
            if (isDependencyError) {
              console.log('Aguardando 1.5s antes de continuar após erro de dependência');
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
        }
        
        // Pequena pausa entre itens para não sobrecarregar o servidor
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // Se tivermos processado muitos itens, pausa breve entre lotes
      if (batch.length >= 10) {
        console.log('Pausa entre lotes para evitar sobrecarga...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Atualizar estatísticas
    const stats = this.syncStatsSubject.value;
    stats.successCount += results.success;
    stats.errorCount += results.error;
    this.syncStatsSubject.next({...stats});
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    // Verificar conexão com a internet antes de tentar
    if (!this.networkService.isOnline()) {
      throw new Error(`Não há conexão com a internet para sincronizar ${item.type}`);
    }

    // Obter o cliente Supabase atual
    const supabase = this.supabaseService.getClient();
    const tableName = this.getTableName(item.type);
    
    // Limpar dados antes de enviar para o servidor
    const cleanData = this.cleanDataForSync(item.type, {...item.data});
    
    console.log(`Sincronizando ${item.action} ${item.type}:`, cleanData);
    
    // Verificar e garantir que registros relacionados existam antes de sincronizar
    // Apenas para operações create/update e tipos que podem ter dependências
    if ((item.action === 'create' || item.action === 'update') && 
        ['attendance', 'work_schedule'].includes(item.type)) {
      const relatedExist = await this.ensureRelatedRecordsExist(item);
      if (!relatedExist) {
        console.warn(`Registros relacionados não encontrados para ${item.type}. Adiando sincronização para próxima tentativa.`);
        // Incrementar contador de tentativas mas não remover da fila
        item.retryCount = (item.retryCount || 0) + 1;
        // Limitar o número máximo de tentativas para evitar loop infinito
        if (item.retryCount >= 5) {
          throw new Error(`Falha após 5 tentativas: registros relacionados não encontrados para ${item.type}`);
        }
        // Atualizar item na fila com novo contador
        this.localStorageService.updateSyncQueueItem(item);
        // Pausar brevemente antes de prosseguir com outros itens
        await new Promise(resolve => setTimeout(resolve, 1000));
        throw new Error(`Registros relacionados não encontrados para ${item.type}. Tentativa ${item.retryCount} de 5.`);
      }
    }
    
    try {
      // Teste de sanidade para verificar o cliente Supabase
      if (!supabase || !supabase.from) {
        console.error('Cliente Supabase inválido ou não inicializado');
        
        // Tentar reinicializar o cliente Supabase
        this.supabaseService.reinitializeClient();
        throw new Error('Cliente Supabase inválido - foi reinicializado');
      }
      
      // Verificar se a tabela existe antes de tentar operações
      // Usar um método mais simples que evita problemas com a sintaxe de count(*)
      console.log(`Verificando acesso à tabela ${tableName}...`);
      
      const { error: tableError } = await supabase
        .from(tableName)
        .select('id', { head: true })
        .limit(1);
        
      if (tableError) {
        console.error(`Erro ao acessar tabela ${tableName}:`, tableError);
        
        // Informações adicionais de diagnóstico
        console.log('Status code:', tableError.code);
        console.log('Detalhes:', tableError.details);
        console.log('Dica:', tableError.hint);
        
        // Registrar cabeçalhos de auth para debug
        const session = await supabase.auth.getSession();
        console.log('Sessão ativa:', session ? 'Sim' : 'Não');
        
        // Comportamentos específicos para códigos de erro comuns
        if (tableError.code?.toString() === '406') {
          console.log('Erro 406 Not Acceptable - Tentando reinicializar o cliente Supabase');
          // Reinicializar cliente e tentar novamente
          this.supabaseService.reinitializeClient();
          
          // Verificar novamente com o novo cliente
          const newSupabase = this.supabaseService.getClient();
          const retryResult = await newSupabase
            .from(tableName)
            .select('id', { head: true })
            .limit(1);
            
          if (!retryResult.error) {
            console.log('Reinicialização bem-sucedida, continuando...');
          } else {
            throw new Error(`Falha na recuperação após reinicialização para tabela ${tableName}: ${retryResult.error.message}`);
          }
        } else if (tableError.code?.toString() === '400') {
          console.log('Erro 400 Bad Request - Tentando abordagem alternativa');
          // Tentar uma abordagem diferente para tabelas que existem mas têm nomes específicos
          if (tableName === 'attendance') {
            // Tentar opção alternativa para checagem de existência
            throw new Error(`Problemas ao acessar tabela de presença. Tente uma sincronização manual mais tarde.`);
          } else {
            throw new Error(`Tabela ${tableName} não existe ou não é acessível: ${tableError.message} (Código: ${tableError.code})`);
          }
        } else {
          throw new Error(`Tabela ${tableName} não existe ou não é acessível: ${tableError.message} (Código: ${tableError.code})`);
        }
      }
      
      // Logging adicional para rastrear operações específicas
      console.log(`Executando operação ${item.action} em ${tableName} com dados:`, cleanData);
      
      switch (item.action) {
        case 'create':
          try {
            const { error: createError } = await supabase
              .from(tableName)
              .insert([cleanData]);
            
            if (createError) {
              console.error(`Erro ao criar ${item.type}:`, createError);
              
              // Verificar erro de duplicidade que pode ser ignorado
              if (createError.code === '23505' || createError.message.includes('duplicate')) {
                console.log(`Registro ${item.type} já existe, ignorando erro de duplicidade`);
                return; // Continuar sem erro para não bloquear a sincronização
              }
              
              throw createError;
            }
            console.log(`Criado com sucesso: ${item.type}`);
          } catch (error) {
            console.error(`Falha ao criar ${item.type}:`, error);
            throw error;
          }
          break;
          
        case 'update':
          try {
            const { error: updateError } = await supabase
              .from(tableName)
              .update(cleanData)
              .eq('id', cleanData.id);
              
            if (updateError) {
              console.error(`Erro ao atualizar ${item.type}:`, updateError);
              throw updateError;
            }
            console.log(`Atualizado com sucesso: ${item.type} (ID: ${cleanData.id})`);
          } catch (error) {
            console.error(`Falha ao atualizar ${item.type}:`, error);
            throw error;
          }
          break;
          
        case 'delete':
          try {
            const { error: deleteError } = await supabase
              .from(tableName)
              .delete()
              .eq('id', cleanData.id);
              
            if (deleteError) {
              console.error(`Erro ao deletar ${item.type}:`, deleteError);
              throw deleteError;
            }
            console.log(`Deletado com sucesso: ${item.type} (ID: ${cleanData.id})`);
          } catch (error) {
            console.error(`Falha ao deletar ${item.type}:`, error);
            throw error;
          }
          break;
      }
    } catch (error) {
      console.error(`Erro ao processar item ${item.type}:${item.id}:`, error);
      // Re-lançar o erro para que seja tratado no nível superior
      throw error;
    }
  }

  private async downloadServerData(): Promise<void> {
    const supabase = this.supabaseService.getClient();
    
    try {
      // Sincronizar funcionários
      console.log('Baixando funcionários...');
      
      // Criar timeout para funcionários
      let empTimeoutId: any = null;
      const empTimeoutPromise = new Promise<any>((_, reject) => {
        empTimeoutId = setTimeout(() => {
          reject(new Error(`Timeout ao baixar funcionários após 20s`));
        }, 20000);
      });
      
      const employeesPromise = supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
        
      const employeesResult = await Promise.race([employeesPromise, empTimeoutPromise]);
      clearTimeout(empTimeoutId);
      
      if (employeesResult.error) throw employeesResult.error;
      if (employeesResult.data) {
        this.localStorageService.saveEmployees(employeesResult.data as Employee[]);
      }

      // Sincronizar presenças (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      console.log('Baixando presenças...');
      
      // Criar timeout para presenças
      let attTimeoutId: any = null;
      const attTimeoutPromise = new Promise<any>((_, reject) => {
        attTimeoutId = setTimeout(() => {
          reject(new Error(`Timeout ao baixar presenças após 30s`));
        }, 30000);
      });
      
      const attendancePromise = supabase
        .from('attendance')
        .select('*, employee:employees(*)')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });
        
      const attendanceResult = await Promise.race([attendancePromise, attTimeoutPromise]);
      clearTimeout(attTimeoutId);
      
      if (attendanceResult.error) throw attendanceResult.error;
      if (attendanceResult.data) {
        // Salvar cada presença individualmente para manter o cache local
        attendanceResult.data.forEach((att: any) => {
          this.localStorageService.saveAttendance({
            ...att,
            synced: true
          } as Attendance);
        });
      }

      // Sincronizar horário de trabalho
      try {
        console.log('Baixando horário de trabalho...');
        
        // Criar timeout para horário de trabalho
        let wsTimeoutId: any = null;
        const wsTimeoutPromise = new Promise<any>((_, reject) => {
          wsTimeoutId = setTimeout(() => {
            reject(new Error(`Timeout ao baixar horário após 10s`));
          }, 10000);
        });
        
        // Verificar se a tabela existe primeiro
        const { error: tableError } = await supabase
          .from('work_schedule')
          .select('count(*)', { count: 'exact', head: true });

        if (tableError) {
          console.warn('Tabela work_schedule pode não existir:', tableError);
          // Se a tabela não existir, usar configuração padrão
          const defaultSchedule = {
            start_time: '08:00',
            end_time: '16:00',
            work_days: [1, 2, 3, 4, 5],
            synced: true
          };
          this.localStorageService.saveWorkSchedule(defaultSchedule as WorkSchedule);
        } else {
          // Se a tabela existir, continuar normalmente
          const workSchedulePromise = supabase
            .from('work_schedule')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
          
          const workScheduleResult = await Promise.race([workSchedulePromise, wsTimeoutPromise]);
          clearTimeout(wsTimeoutId);
          
          if (workScheduleResult.error) {
            console.warn('Erro ao buscar horário de trabalho:', workScheduleResult.error);
            // Em caso de erro, não lançar exception, apenas usar o cache
          } else if (workScheduleResult.data && workScheduleResult.data.length > 0) {
            this.localStorageService.saveWorkSchedule({
              ...workScheduleResult.data[0],
              synced: true
            } as WorkSchedule);
          } else {
            console.log('Nenhum horário de trabalho encontrado no servidor');
          }
        }
      } catch (wsError) {
        console.warn('Erro ao sincronizar horário de trabalho:', wsError);
        // Erros na sincronização de horário não devem interromper todo o processo
      }

    } catch (error) {
      console.error('Erro ao baixar dados do servidor:', error);
      // Não rejeita a promise aqui para permitir sincronização parcial
      this.syncErrorSubject.next(error instanceof Error ? error.message : 'Erro ao baixar dados');
    }
  }

  private getTableName(type: string): string {
    const tableMap: { [key: string]: string } = {
      'employee': 'employees',
      'attendance': 'attendance',
      'work_schedule': 'work_schedule',
      'schedule': 'schedule_data',
      'record': 'daily_records'
    };
    
    const tableName = tableMap[type];
    if (!tableName) {
      throw new Error(`Tipo de tabela desconhecido: ${type}`);
    }
    
    return tableName;
  }

  private startAutoSync(): void {
    // Auto sync com intervalo progressivo (exponential backoff)
    timer(30000, 60000).pipe( // Verificar a cada 1 min
      switchMap(async () => {
        if (this.networkService.isOnline() && !this.isSyncingSubject.value) {
          const pendingCount = this.getPendingSyncCount();
          
          if (pendingCount > 0) {
            // Calcular delay com exponential backoff
            const syncDelay = this.calculateSyncDelay();
            
            // Se já passou tempo suficiente desde a última tentativa
            const lastSync = this.lastSyncSubject.value;
            const now = new Date();
            
            if (!lastSync || (now.getTime() - lastSync.getTime()) > syncDelay) {
              try {
                console.log(`Sincronização automática após ${syncDelay/1000}s de espera`);
                await this.syncAll();
              } catch (error) {
                console.warn('Falha na sincronização automática:', error);
              }
            }
          }
        }
      }),
      catchError(error => {
        console.error('Erro na sincronização automática:', error);
        return [];
      })
    ).subscribe();
  }

  // Cálculo de backoff exponencial para retry
  private calculateSyncDelay(): number {
    if (this.syncRetryAttempts === 0) return 0;
    
    // Base: 30s, duplicando a cada tentativa até máximo de 30 minutos
    const baseDelay = 30 * 1000; // 30 segundos
    const maxDelay = 30 * 60 * 1000; // 30 minutos
    
    const delay = Math.min(
      baseDelay * Math.pow(2, this.syncRetryAttempts - 1),
      maxDelay
    );
    
    // Adicionar jitter para evitar thundering herd
    return delay * (0.8 + Math.random() * 0.4);
  }

  private loadLastSyncTime(): void {
    const lastSync = this.localStorageService.getLastSyncTimestamp();
    this.lastSyncSubject.next(lastSync);
  }

  getPendingSyncCount(): number {
    return this.localStorageService.getPendingSyncCount();
  }

  getUnsyncedItemsCount(): { [key: string]: number } {
    return this.localStorageService.getUnsyncedItemsCount();
  }

  // Força sincronização manual
  async forcSync(): Promise<void> {
    if (!this.networkService.isOnline()) {
      throw new Error('Sem conexão com a internet');
    }
    
    // Resetar contador de tentativas para sincronização forçada
    this.syncRetryAttempts = 0;
    return this.syncAll();
  }

  // Sincronização apenas de upload (para quando há muitos dados locais)
  async syncOnlyUploads(): Promise<void> {
    if (!this.networkService.isOnline()) {
      throw new Error('Sem conexão com a internet');
    }

    this.isSyncingSubject.next(true);
    
    try {
      await this.uploadLocalChanges();
      this.localStorageService.setLastSyncTimestamp();
      this.lastSyncSubject.next(new Date());
      this.updateSyncStats();
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    } finally {
      this.isSyncingSubject.next(false);
    }
  }

  // Verifica se os dados locais estão desatualizados
  isDataStale(): boolean {
    const lastSync = this.lastSyncSubject.value;
    if (!lastSync) return true;
    
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    return hoursSinceSync > 4; // Considera stale após 4 horas
  }

  // Atualiza as estatísticas de sincronização
  private updateSyncStats(): void {
    const pendingItems = this.getPendingSyncCount();
    const lastSync = this.lastSyncSubject.value;
    
    const stats = this.syncStatsSubject.value;
    stats.lastSync = lastSync;
    stats.pendingItems = pendingItems;
    
    this.syncStatsSubject.next({...stats});
  }
  
  /**
   * Limpa os dados antes de enviá-los para o servidor, removendo propriedades que
   * não são colunas na tabela do banco de dados, como objetos de relacionamentos,
   * metadados de cache e sincronização.
   */
  private cleanDataForSync(type: string, data: any): any {
    if (!data) return {};
    
    const cleanedData = {...data};
    
    // Lista de propriedades comuns para remover em todos os tipos
    const commonPropsToRemove = [
      // Metadados de sincronização e cache
      'synced', 'cached_at', 'sync_status',
      // Timestamps locais
      'created_at_local', 'updated_at_local', 'modified_at_local', 
      // Flags de controle
      'isDeleted', 'is_deleted', 'isModified', 'is_modified',
      // Propriedades de UI
      'expanded', 'selected', 'visible', 'editing',
      // Propriedades de relações que podem ter sido carregadas
      'employees', 'attendances', 'records', 'schedules',
      // Propriedades de rastreamento local
      'local_id', 'local_created_at', 'local_updated_at',
      // Dados de autenticação
      'auth_data', 'auth_info'
    ];
    
    // Remover todas as propriedades comuns
    commonPropsToRemove.forEach(prop => {
      if (cleanedData.hasOwnProperty(prop)) {
        delete cleanedData[prop];
      }
    });
    
    // Limpar propriedades específicas por tipo
    switch (type) {
      case 'attendance':
        // Remover objetos de relação
        delete cleanedData.employee;
        
        // Verificar estrutura esperada e corrigir se necessário
        if (!cleanedData.date && cleanedData.attendance_date) {
          cleanedData.date = cleanedData.attendance_date;
          delete cleanedData.attendance_date;
        }
        break;
        
      case 'employee':
        // Remover informações de autenticação e perfil que não devem ser enviadas
        const employeePropsToRemove = [
          'auth_data', 'auth_id', 'token', 'full_name', 'display_name',
          'profile_image', 'avatar_url', 'user_metadata', 'app_metadata'
        ];
        
        employeePropsToRemove.forEach(prop => {
          if (cleanedData.hasOwnProperty(prop)) {
            delete cleanedData[prop];
          }
        });
        break;
        
      case 'work_schedule':
        // Remover campos de analytics e metadados
        const schedulePropsToRemove = [
          'last_modified_by', 'modified_by_name', 'modified_by_id',
          'created_by', 'created_by_name', 'settings', 'config'
        ];
        
        schedulePropsToRemove.forEach(prop => {
          if (cleanedData.hasOwnProperty(prop)) {
            delete cleanedData[prop];
          }
        });
        
        // Corrigir formato dos work_days se for necessário
        if (cleanedData.work_days && typeof cleanedData.work_days === 'string') {
          try {
            cleanedData.work_days = JSON.parse(cleanedData.work_days);
          } catch (e) {
            console.warn('Erro ao converter work_days:', e);
            cleanedData.work_days = [1, 2, 3, 4, 5]; // Padrão: segunda a sexta
          }
        }
        break;
        
      case 'schedule':
      case 'record':
        // Converter todas as propriedades camelCase para snake_case
        const camelToSnake = {
          startTime: 'start_time',
          endTime: 'end_time',
          workDays: 'work_days',
          workHours: 'work_hours',
          createdAt: 'created_at',
          updatedAt: 'updated_at',
          employeeId: 'employee_id',
          recordDate: 'record_date',
          scheduleDate: 'schedule_date',
          lateMinutes: 'late_minutes',
          checkIn: 'check_in',
          checkOut: 'check_out',
          authMethod: 'auth_method'
        };
        
        // Aplicar todas as conversões
        Object.entries(camelToSnake).forEach(([camel, snake]) => {
          if (cleanedData.hasOwnProperty(camel)) {
            cleanedData[snake] = cleanedData[camel];
            delete cleanedData[camel];
          }
        });
        break;
    }
    
    // Garantir que id está presente para operações de update/delete
    if (!cleanedData.id && data.id) {
      cleanedData.id = data.id;
    }
    
    // Remover propriedades undefined ou null
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === undefined || cleanedData[key] === null) {
        delete cleanedData[key];
      }
    });
    
    return cleanedData;
  }
  
  /**
   * Verifica se a sincronização está demorando muito
   * @returns Verdadeiro se a sincronização está ativa por mais de 60 segundos
   */
  private isSyncStuck(): boolean {
    // Se não está sincronizando, não está travado
    if (!this.isSyncingSubject.value) return false;
    
    const lastSync = this.lastSyncSubject.value;
    if (!lastSync) return false;
    
    // Se a última sincronização foi há mais de 60 segundos e ainda está sincronizando
    const maxSyncTime = 60 * 1000; // 60 segundos
    const timeSinceLastSync = Date.now() - lastSync.getTime();
    
    return timeSinceLastSync > maxSyncTime;
  }
  
  /**
   * Sincroniza itens em lotes para evitar sobrecarga quando há muitos itens pendentes
   * Use quando há centenas ou milhares de itens pendentes
   * @param batchSize Tamanho do lote (recomendado: 50-100)
   */
  async batchSync(batchSize: number = 50): Promise<{success: number, error: number, remaining: number}> {
    if (!this.networkService.isOnline()) {
      throw new Error('Sem conexão com a internet');
    }
    
    if (this.isSyncingSubject.value) {
      console.log('Sincronização já em andamento');
      return { success: 0, error: 0, remaining: this.getPendingSyncCount() };
    }
    
    this.isSyncingSubject.next(true);
    
    try {
      // Obter todos os itens pendentes
      const allItems = this.localStorageService.getSyncQueue();
      console.log(`Processando ${allItems.length} itens em lotes de ${batchSize}`);
      
      // Tomar apenas o primeiro lote
      const batchItems = allItems.slice(0, batchSize);
      const results = { success: 0, error: 0 };
      
      // Processar esse lote
      for (const item of batchItems) {
        // Usar timeout para cada item
        let timeoutId: any = null;
        const timeoutPromise = new Promise<void>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Timeout ao processar item ${item.type}:${item.id}`));
          }, 10000); // timeout mais curto para processar mais rápido
        });
        
        try {
          await Promise.race([
            this.processSyncItem(item),
            timeoutPromise
          ]);
          
          clearTimeout(timeoutId);
          this.localStorageService.removeSyncQueueItem(item.id);
          results.success++;
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('Erro ao sincronizar item em lote:', item, error);
          results.error++;
          
          // Incrementar contador de tentativas
          item.retryCount = (item.retryCount || 0) + 1;
          
          if (item.retryCount >= 3) {
            console.warn('Item removido após 3 tentativas (lote):', item);
            this.localStorageService.removeSyncQueueItem(item.id);
          } else {
            this.localStorageService.updateSyncQueueItem(item);
          }
        }
      }
      
      // Atualizar estatísticas
      const stats = this.syncStatsSubject.value;
      stats.successCount += results.success;
      stats.errorCount += results.error;
      this.syncStatsSubject.next({...stats});
      
      // Atualizar timestamp da última sincronização parcial
      const now = new Date();
      this.localStorageService.setLastSyncTimestamp();
      this.lastSyncSubject.next(now);
      
      // Calcular itens restantes
      const remaining = this.getPendingSyncCount();
      
      return {
        ...results,
        remaining
      };
    } catch (error) {
      console.error('Erro durante sincronização em lotes:', error);
      return { 
        success: 0, 
        error: 0, 
        remaining: this.getPendingSyncCount() 
      };
    } finally {
      this.isSyncingSubject.next(false);
    }
  }
  
  /**
   * Resolve problemas de acúmulo de itens na fila de sincronização
   * Use quando há muitos itens pendentes (centenas ou milhares)
   * @returns Informações sobre o progresso da sincronização
   */
  async resolveSyncBacklog(): Promise<{success: number, error: number, remaining: number}> {
    // Verificar se há uma grande quantidade de itens pendentes
    const pendingCount = this.getPendingSyncCount();
    console.log(`Resolvendo acúmulo de ${pendingCount} itens pendentes`);
    
    if (pendingCount <= 0) {
      return { success: 0, error: 0, remaining: 0 };
    }
    
    // Sincronizar em lotes para não sobrecarregar
    return this.batchSync(100);
  }
  
  /**
   * Limpa itens problemáticos da fila que possam estar travando a sincronização
   * @param olderThanDays Remove itens mais antigos que X dias
   * @returns Número de itens removidos
   */
  cleanupSyncQueue(olderThanDays: number = 7): number {
    // Obter todos os itens
    const allItems = this.localStorageService.getSyncQueue();
    let removedCount = 0;
    
    // Data de corte
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    for (const item of allItems) {
      // Converter timestamp para Date se for string
      const itemDate = typeof item.timestamp === 'string' 
        ? new Date(item.timestamp) 
        : item.timestamp;
      
      // Verificar se é mais antigo que o limite
      if (itemDate < cutoffDate) {
        this.localStorageService.removeSyncQueueItem(item.id);
        removedCount++;
      }
    }
    
    console.log(`Removidos ${removedCount} itens antigos da fila de sincronização`);
    this.updateSyncStats();
    return removedCount;
  }
  
  /**
   * Analisa a fila de sincronização para identificar problemas
   * @returns Informações de diagnóstico sobre a fila
   */
  diagnosticSyncQueue(): {
    totalItems: number,
    byType: {[key: string]: number},
    byAction: {[key: string]: number},
    retryStats: {
      withRetries: number,
      maxRetries: number,
      avgRetries: number
    },
    oldestItem: Date | null,
    newestItem: Date | null
  } {
    // Obter todos os itens
    const allItems = this.localStorageService.getSyncQueue();
    
    // Contadores por tipo
    const typeCount: {[key: string]: number} = {};
    const actionCount: {[key: string]: number} = {};
    
    // Estatísticas de retry
    let itemsWithRetry = 0;
    let totalRetries = 0;
    let maxRetries = 0;
    
    // Datas
    let oldestTimestamp: Date | null = null;
    let newestTimestamp: Date | null = null;
    
    for (const item of allItems) {
      // Contar por tipo
      typeCount[item.type] = (typeCount[item.type] || 0) + 1;
      
      // Contar por ação
      actionCount[item.action] = (actionCount[item.action] || 0) + 1;
      
      // Estatísticas de retry
      if (item.retryCount && item.retryCount > 0) {
        itemsWithRetry++;
        totalRetries += item.retryCount;
        maxRetries = Math.max(maxRetries, item.retryCount);
      }
      
      // Verificar datas
      const itemDate = typeof item.timestamp === 'string' 
        ? new Date(item.timestamp) 
        : item.timestamp;
        
      if (!oldestTimestamp || itemDate < oldestTimestamp) {
        oldestTimestamp = itemDate;
      }
      
      if (!newestTimestamp || itemDate > newestTimestamp) {
        newestTimestamp = itemDate;
      }
    }
    
    return {
      totalItems: allItems.length,
      byType: typeCount,
      byAction: actionCount,
      retryStats: {
        withRetries: itemsWithRetry,
        maxRetries,
        avgRetries: itemsWithRetry > 0 ? totalRetries / itemsWithRetry : 0
      },
      oldestItem: oldestTimestamp,
      newestItem: newestTimestamp
    };
  }
  
  /**
   * Testa a conexão com Supabase e verifica o acesso às tabelas
   * Útil para diagnóstico de problemas de conexão
   * @returns Informações sobre o estado da conexão e tabelas
   */
  async testSupabaseConnection(): Promise<{
    connected: boolean,
    tables: {[key: string]: boolean},
    error?: string,
    headers?: any
  }> {
    if (!this.networkService.isOnline()) {
      return {
        connected: false,
        tables: {},
        error: 'Não há conexão com a internet'
      };
    }
    
    const supabase = this.supabaseService.getClient();
    const result: {
      connected: boolean,
      tables: {[key: string]: boolean},
      error?: string,
      headers?: any
    } = {
      connected: false,
      tables: {},
      headers: {}
    };
    
    try {
      // Testar se o Supabase está online com uma consulta simples
      const { data, error } = await supabase
        .from('employees')
        .select('count', { count: 'exact', head: true })
        .limit(0);
      
      if (error) {
        result.connected = false;
        result.error = `Erro ao conectar com Supabase: ${error.message}`;
        return result;
      }
      
      result.connected = true;
      
      // Verificar acesso a cada tabela
      const tables = ['employees', 'attendance', 'work_schedule', 'schedule_data', 'daily_records'];
      
      for (const table of tables) {
        try {
          const { error: tableError } = await supabase
            .from(table)
            .select('count', { count: 'exact', head: true })
            .limit(0);
          
          result.tables[table] = !tableError;
          
          if (tableError) {
            console.warn(`Erro ao acessar tabela ${table}:`, tableError);
          }
        } catch (e) {
          result.tables[table] = false;
          console.error(`Exceção ao testar tabela ${table}:`, e);
        }
      }
      
      // Verificar cabeçalhos sendo enviados
      try {
        // Capturar cabeçalhos para diagnóstico - usar a URL do environment
        const response = await fetch(`${environment.supabaseUrl}/rest/v1/employees?select=count`, {
          method: 'HEAD',
          headers: {
            'apikey': environment.supabaseKey,
            'Authorization': `Bearer ${environment.supabaseKey}`,
            'Accept': 'application/json, */*',
            'Content-Type': 'application/json'
          }
        });
        
        result.headers = {
          sent: {
            'apikey': 'present (masked)',
            'Authorization': 'present (masked)',
            'Accept': 'application/json, */*',
            'Content-Type': 'application/json'
          },
          received: {
            status: response.status,
            statusText: response.statusText
          }
        };
        
        // Adicionar headers recebidos
        response.headers.forEach((value, key) => {
          if (result.headers && result.headers.received) {
            result.headers.received[key] = value;
          }
        });
        
      } catch (headerError: unknown) {
        console.error('Erro ao testar cabeçalhos:', headerError);
        result.headers = { 
          error: headerError instanceof Error ? headerError.message : 'Erro desconhecido' 
        };
      }
      
      return result;
    } catch (e) {
      console.error('Erro ao testar conexão:', e);
      return {
        connected: false,
        tables: {},
        error: `Exceção ao testar conexão: ${e instanceof Error ? e.message : String(e)}`
      };
    }
  }
  
  /**
   * Sincroniza dados em lotes menores para evitar sobrecarga
   */
  async syncInBatches(): Promise<void> {
    if (!this.networkService.isOnline()) {
      throw new Error('Sem conexão com a internet');
    }
    
    this.isSyncingSubject.next(true);
    this.syncErrorSubject.next(null);
    
    try {
      console.log('Iniciando sincronização em lotes pequenos...');
      
      // 1. Reordenar a fila para priorizar os itens mais importantes
      const queue = this.localStorageService.getSyncQueue();
      
      // Agrupamento por tipo para processamento em ordem específica
      const employees = queue.filter(item => item.type === 'employee');
      const workSchedules = queue.filter(item => item.type === 'work_schedule');
      const attendance = queue.filter(item => item.type === 'attendance');
      const others = queue.filter(item => 
        !['employee', 'work_schedule', 'attendance'].includes(item.type));
      
      console.log(`Itens agrupados: ${employees.length} funcionários, ${workSchedules.length} horários, ` +
                 `${attendance.length} presenças, ${others.length} outros`);
      
      // 2. Processar cada grupo separadamente
      const processGroup = async (items: SyncQueueItem[], groupName: string) => {
        if (items.length === 0) return { success: 0, error: 0 };
        
        console.log(`Processando grupo ${groupName} (${items.length} itens)...`);
        const results = { success: 0, error: 0 };
        
        // Processar em mini-lotes para evitar sobrecarga
        const MINI_BATCH = 5;
        
        for (let i = 0; i < items.length; i += MINI_BATCH) {
          const batch = items.slice(i, i + MINI_BATCH);
          console.log(`Processando mini-lote ${Math.floor(i / MINI_BATCH) + 1}/${Math.ceil(items.length / MINI_BATCH)} do grupo ${groupName}`);
          
          for (const item of batch) {
            try {
              await this.processSyncItem(item);
              this.localStorageService.removeSyncQueueItem(item.id);
              results.success++;
            } catch (error) {
              console.error(`Erro em ${groupName}:`, error);
              results.error++;
              
              // Atualizar contador de tentativas
              item.retryCount = (item.retryCount || 0) + 1;
              if (item.retryCount >= 3) {
                console.warn(`Removendo item após ${item.retryCount} tentativas:`, item);
                this.localStorageService.removeSyncQueueItem(item.id);
              } else {
                this.localStorageService.updateSyncQueueItem(item);
              }
            }
            
            // Breve pausa entre itens
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          // Pausa entre mini-lotes
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return results;
      };
      
      // 3. Processar na ordem: funcionários -> horários -> presenças -> outros
      const empResults = await processGroup(employees, 'funcionários');
      const wsResults = await processGroup(workSchedules, 'horários');
      const attResults = await processGroup(attendance, 'presenças');
      const otherResults = await processGroup(others, 'outros');
      
      // 4. Combinar resultados
      const totalResults = {
        success: empResults.success + wsResults.success + attResults.success + otherResults.success,
        error: empResults.error + wsResults.error + attResults.error + otherResults.error
      };
      
      console.log(`Sincronização em lotes concluída: ${totalResults.success} sucessos, ${totalResults.error} falhas`);
      
      // 5. Atualizar estatísticas
      const stats = this.syncStatsSubject.value;
      stats.successCount += totalResults.success;
      stats.errorCount += totalResults.error;
      this.syncStatsSubject.next({...stats});
      
      // 6. Atualizar timestamp
      const now = new Date();
      this.localStorageService.setLastSyncTimestamp();
      this.lastSyncSubject.next(now);
      
    } catch (error) {
      console.error('Erro na sincronização em lotes:', error);
      this.syncErrorSubject.next(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      this.isSyncingSubject.next(false);
    }
  }
  
  /**
   * Sincroniza apenas os funcionários
   */
  async syncOnlyEmployees(): Promise<void> {
    if (!this.networkService.isOnline()) {
      throw new Error('Sem conexão com a internet');
    }
    
    this.isSyncingSubject.next(true);
    const results = { success: 0, error: 0 };
    
    try {
      console.log('Sincronizando apenas funcionários...');
      
      // 1. Filtrar apenas itens de funcionário da fila
      const queue = this.localStorageService.getSyncQueue();
      const employeeItems = queue.filter(item => item.type === 'employee');
      
      if (employeeItems.length === 0) {
        console.log('Nenhum funcionário para sincronizar.');
        
        // Se não há funcionários na fila, tentar baixar do servidor
        await this.refreshEmployees();
        return;
      }
      
      console.log(`Encontrados ${employeeItems.length} funcionários para sincronizar`);
      
      // 2. Processar cada funcionário
      for (const item of employeeItems) {
        try {
          await this.processSyncItem(item);
          this.localStorageService.removeSyncQueueItem(item.id);
          results.success++;
        } catch (error) {
          console.error('Erro ao sincronizar funcionário:', error);
          results.error++;
        }
      }
      
      // 3. Atualizar estatísticas
      const stats = this.syncStatsSubject.value;
      stats.successCount += results.success;
      stats.errorCount += results.error;
      this.syncStatsSubject.next({...stats});
      
      console.log(`Sincronização de funcionários concluída: ${results.success} sucessos, ${results.error} falhas`);
    } catch (error) {
      console.error('Erro na sincronização de funcionários:', error);
      this.syncErrorSubject.next(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      this.isSyncingSubject.next(false);
    }
  }
  
  /**
   * Baixa dados atualizados de funcionários do servidor
   */
  async refreshEmployees(): Promise<void> {
    if (!this.networkService.isOnline()) {
      throw new Error('Sem conexão com a internet');
    }
    
    this.isSyncingSubject.next(true);
    
    try {
      console.log('Baixando dados atualizados de funcionários...');
      
      // Obter cliente Supabase
      const supabase = this.supabaseService.getClient();
      
      // Baixar funcionários
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (employees && employees.length > 0) {
        console.log(`Recebidos ${employees.length} funcionários do servidor`);
        
        // Salvar no armazenamento local
        this.localStorageService.saveEmployees(employees);
        
        console.log('Dados de funcionários atualizados com sucesso');
      } else {
        console.log('Nenhum funcionário encontrado no servidor');
      }
      
      // Atualizar timestamp
      const now = new Date();
      this.localStorageService.setLastSyncTimestamp();
      this.lastSyncSubject.next(now);
      
    } catch (error) {
      console.error('Erro ao baixar dados de funcionários:', error);
      this.syncErrorSubject.next(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      this.isSyncingSubject.next(false);
    }
  }
  
  /**
   * Reinicializa o cliente Supabase para resolver problemas de conexão
   */
  async reinitializeSupabaseClient(): Promise<void> {
    try {
      console.log('Reinicializando cliente Supabase...');
      this.supabaseService.reinitializeClient();
      
      // Testar conexão após reinicialização
      const diagnosis = await this.supabaseService.diagnoseConnection();
      
      if (diagnosis.status === 'ok') {
        console.log('Cliente Supabase reinicializado com sucesso');
      } else {
        console.warn('Cliente reinicializado, mas ainda há problemas:', diagnosis);
        throw new Error(`Problemas persistentes após reinicialização: ${diagnosis.error}`);
      }
    } catch (error) {
      console.error('Erro ao reinicializar cliente Supabase:', error);
      throw error;
    }
  }
  
  /**
   * Verifica e garante a existência de registros relacionados no servidor
   * antes de sincronizar um item que depende desses registros
   */
  private async ensureRelatedRecordsExist(item: SyncQueueItem): Promise<boolean> {
    // Apenas para itens de criação ou atualização
    if (item.action === 'delete') return true;
    
    const supabase = this.supabaseService.getClient();
    const cleanData = this.cleanDataForSync(item.type, {...item.data});

    try {
      // Verificações específicas por tipo
      switch (item.type) {
        case 'attendance':
          // Verificar se o funcionário existe no servidor
          if (cleanData.employee_id) {
            const { data, error } = await supabase
              .from('employees')
              .select('id')
              .eq('id', cleanData.employee_id)
              .maybeSingle();
              
            if (error) {
              console.error('Erro ao verificar funcionário:', error);
              return false;
            }
            
            // Se o funcionário não existe no servidor
            if (!data) {
              console.log(`Funcionário ${cleanData.employee_id} não existe no servidor, enviando dados do funcionário primeiro`);
              
              // Buscar dados completos do funcionário no armazenamento local
              const localEmployee = await this.localStorageService.getEmployeeById(cleanData.employee_id);
              
              if (!localEmployee) {
                console.error(`Funcionário ${cleanData.employee_id} não encontrado localmente`);
                // Marcar como dependência não encontrada - será tratada pelo mecanismo de recuperação
                return false;
              }
              
              // Criar funcionário no servidor
              const cleanEmployeeData = this.cleanDataForSync('employee', {...localEmployee});
              const { error: createError } = await supabase
                .from('employees')
                .insert([cleanEmployeeData]);
                
              if (createError) {
                // Ignore erros de duplicidade
                if (createError.code === '23505' || createError.message.includes('duplicate')) {
                  console.log(`Funcionário já existe, ignorando erro de duplicidade`);
                  return true;
                }
                
                console.error('Erro ao criar funcionário no servidor:', createError);
                return false;
              }
              
              console.log(`Funcionário ${cleanData.employee_id} criado no servidor com sucesso`);
            }
          }
          break;
          
        case 'work_schedule':
          // Verificar se o funcionário existe
          if (cleanData.employee_id) {
            const { data, error } = await supabase
              .from('employees')
              .select('id')
              .eq('id', cleanData.employee_id)
              .maybeSingle();
              
            if (error || !data) {
              // Tentar criar o funcionário primeiro
              console.log(`Funcionário para horário não existe, criando primeiro...`);
              
              // Buscar dados do funcionário localmente...
              const localEmployee = await this.localStorageService.getEmployeeById(cleanData.employee_id);
              if (!localEmployee) return false;
              
              // Criar funcionário...
              // (mesmo código do caso attendance)
              return false;
            }
          }
          break;
          
        // Adicionar outras verificações conforme necessário
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar registros relacionados:', error);
      return false;
    }
  }
}
