import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    this.initializeNetworkListeners();
  }

  get isOnline$(): Observable<boolean> {
    return this.onlineSubject.asObservable();
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  private initializeNetworkListeners(): void {
    fromEvent(window, 'online').subscribe(() => {
      this.onlineSubject.next(true);
    });

    fromEvent(window, 'offline').subscribe(() => {
      this.onlineSubject.next(false);
    });
  }

  /**
   * Utilitário para garantir que operações seguras possam ser realizadas offline
   * mas operações sensíveis sejam bloqueadas quando offline
   * 
   * @param operation O tipo de operação a ser verificada
   * @returns true se a operação é segura para realizar no estado atual de rede
   */
  canPerformOperation(operation: 'read' | 'write' | 'delete' | 'auth'): boolean {
    // Autenticação sempre requer conexão
    if (operation === 'auth' && !this.isOnline()) {
      return false;
    }
    
    // Todas as outras operações são permitidas offline
    return true;
  }

  /**
   * Exibe uma mensagem apropriada quando uma operação não pode ser realizada
   * devido ao estado da rede
   * 
   * @param operation O tipo de operação que foi tentada
   * @returns Mensagem explicativa para o usuário
   */
  getOfflineOperationMessage(operation: 'read' | 'write' | 'delete' | 'auth'): string {
    switch (operation) {
      case 'auth':
        return 'Autenticação requer conexão com a internet. Por favor, conecte-se e tente novamente.';
      case 'read':
        return 'Usando dados salvos localmente. Alguns dados podem não estar atualizados.';
      case 'write':
        return 'Alterações foram salvas localmente e serão enviadas ao servidor quando a conexão for restaurada.';
      case 'delete':
        return 'Operação de exclusão será sincronizada quando a conexão for restaurada.';
      default:
        return 'Esta operação não está disponível no modo offline.';
    }
  }
}
