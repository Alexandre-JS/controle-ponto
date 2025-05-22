import { Component, OnInit, HostListener } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule]
})
export class AppComponent implements OnInit {
  isAuthenticated = false;
  userEmail: string = '';
  userAvatar: string | null = null;
  isDesktop = false;
  isLoginPage = false; // Variável para verificar se estamos na página de login

  public appPages = [
    { title: 'Dashboard', url: '/admin/daily-attendance', icon: 'home' },
    { title: 'Control de ponto', url: '/kiosk', icon: 'checkmark-circle' },
    { title: 'Funcionários', url: '/admin/employee', icon: 'people' },
    { title: 'Relatórios', url: '/admin/report', icon: 'bar-chart' },
    { title: 'Configurações', url: '/admin/settings', icon: 'settings' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
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
  }

  ngOnInit() {
    this.loadUserProfile();
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
      await this.authService.logout();
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  async goToLogin() {
    try {
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }
}