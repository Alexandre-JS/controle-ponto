import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ThemeService } from './services/theme.service';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { NetworkService } from './services/network.service';
import { Subscription } from 'rxjs';
import { SidebarChangelogComponent } from './components/sidebar-changelog/sidebar-changelog.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule, ThemeToggleComponent, SidebarChangelogComponent]
})
export class AppComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  userEmail: string = '';
  userAvatar: string | null = null;
  isDesktop = false;
  isLoginPage = false; // Variável para verificar se estamos na página de login
  isOnline = navigator.onLine;
  isOfflineMode = false;
  private subscriptions: Subscription[] = [];
  pendingSyncCount = 0;

  public appPages = [
    { title: 'Dashboard', url: '/admin/daily-attendance', icon: 'home' },
    { title: 'Control de ponto', url: '/kiosk', icon: 'checkmark-circle' },
    { title: 'Funcionários', url: '/admin/employee', icon: 'people' },
    { title: 'Relatórios', url: '/admin/report', icon: 'bar-chart' },
    { title: 'Configurações', url: '/admin/settings', icon: 'settings' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private networkService: NetworkService,
    private toastController: ToastController
  ) {
    // Initialize auth state on app start
    this.authService.isAuthenticated().subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (!isAuth) {
        // Only redirect if not in login page
        if (!window.location.href.includes('/login')) {
          window.location.href = '/login';
        }
      }
    });

    this.checkScreenSize();

    // Detectar mudanças de rota para identificar a página de login
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Verifica se a URL atual contém 'login'
        this.isLoginPage = event.url.includes('/login');
      });

    // Verificação inicial ao carregar a aplicação
    this.isLoginPage = window.location.href.includes('/login');

    // Monitorar estado da conexão
    // this.subscriptions.push(
    //   this.networkService.isOnline$.subscribe(isOnline => {
    //     const wasOffline = !this.isOnline && isOnline;
    //     this.isOnline = isOnline;
    //     this.isOfflineMode = !isOnline; // Atualiza isOfflineMode conforme o estado da conexão

    //     // Se voltou a ficar online, tentar sincronizar
    //     if (wasOffline) {
    //       this.showToast('Conexão restaurada', 'success');
    //       this.syncService.syncAll().catch(err => {
    //         console.error('Erro ao sincronizar após reconexão:', err);
    //       });
    //     } else if (!isOnline) {
    //       this.showToast('Modo offline - Os dados serão sincronizados quando a conexão for restaurada', 'warning');
    //     }
    //   })
    // );
  }

  ngOnInit() {
    this.loadUserProfile();
    this.setupNetworkListeners();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isDesktop = window.innerWidth > 768; // Breakpoint para desktop
  }

  async loadUserProfile() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.userEmail = user.email || '';
      this.userAvatar = user.user_metadata ? user.user_metadata['avatar_url'] : null;
    }
  }

  async editProfile() {
    // Implementar navegação para página de perfil
    // await this.router.navigate(['/profile']);
  }

  async logout() {
    try {
      // Sair do aplicativo
      await this.authService.logout();

      // Redirecionar para login
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      this.showToast('Erro ao sair da aplicação', 'danger');
    }
  }

  async goToLogin() {
    try {
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  private setupNetworkListeners() {
    // Monitorar estado da conexão
    this.subscriptions.push(
      this.networkService.isOnline$.subscribe(isOnline => {
        const wasOffline = !this.isOnline && isOnline;
        this.isOnline = isOnline;
        this.isOfflineMode = !isOnline; // Atualiza isOfflineMode conforme o estado da conexão

        // Notificar o usuário sobre o estado da conexão
        if (wasOffline) {
          this.showToast('Conexão restaurada', 'success');
        } else if (!isOnline) {
          this.showToast('Sem conexão com a internet', 'warning');
        }
      })
    );
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }
}
