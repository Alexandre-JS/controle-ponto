import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { NetworkService } from '../services/network.service';
import { Subscription } from 'rxjs';

/**
 * Diretiva que desabilita elementos quando o aplicativo está offline.
 * Útil para botões e funcionalidades que requerem conexão com a internet.
 * 
 * Exemplo de uso:
 * <button [appOfflineDisable]="true" [offlineOperation]="'auth'">Login</button>
 */
@Directive({
  selector: '[appOfflineDisable]',
  standalone: true
})
export class OfflineDisableDirective implements OnInit, OnDestroy {
  @Input() appOfflineDisable = true;
  @Input() offlineOperation: 'read' | 'write' | 'delete' | 'auth' = 'auth';
  
  private networkSubscription: Subscription | null = null;
  private originalTitle = '';
  
  constructor(
    private el: ElementRef,
    private networkService: NetworkService
  ) {}
  
  ngOnInit() {
    if (this.appOfflineDisable) {
      this.originalTitle = this.el.nativeElement.title || '';
      this.networkSubscription = this.networkService.isOnline$.subscribe(() => {
        this.updateElementState();
      });
      // Inicializa o estado
      this.updateElementState();
    }
  }
  
  ngOnDestroy() {
    if (this.networkSubscription) {
      this.networkSubscription.unsubscribe();
    }
  }
  
  private updateElementState() {
    const canPerform = this.networkService.canPerformOperation(this.offlineOperation);
    this.el.nativeElement.disabled = !canPerform;
    
    if (!canPerform) {
      this.el.nativeElement.classList.add('offline-disabled');
      this.el.nativeElement.title = this.networkService.getOfflineOperationMessage(this.offlineOperation);
    } else {
      this.el.nativeElement.classList.remove('offline-disabled');
      this.el.nativeElement.title = this.originalTitle;
    }
  }
}
