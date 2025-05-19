import { Component, OnInit, HostListener } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { RouterModule, Router } from '@angular/router';

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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.checkScreenSize();
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
    await this.authService.logout();
  }

  async goToLogin() {
    try {
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }
}
