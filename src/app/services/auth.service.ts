import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<boolean>(false);

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.initAuth();
  }

  private async initAuth() {
    const session = await this.supabase.getClient().auth.getSession();
    this.authState.next(!!session.data.session);
    
    // Subscribe to auth changes
    this.supabase.session.subscribe((session) => {
      this.authState.next(!!session);
      if (!session && !window.location.pathname.includes('/login')) {
        this.router.navigate(['/login']);
      }
    });
  }

  async login(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.signIn(email, password);
      
      if (error) throw error;
      
      if (data?.user) {
        this.authState.next(true);
        await this.router.navigate(['/admin/employee']);
        return null;
      }
      
      throw new Error('Erro ao fazer login');
    } catch (error: any) {
      this.authState.next(false);
      console.error('Erro login:', error);
      return error.message || 'Erro ao fazer login';
    }
  }

  checkAuthentication() {
    return this.supabase.session.pipe(
      map(session => {
        const isAuth = !!session;
        this.authState.next(isAuth);
        return isAuth;
      })
    );
  }

  async signUp(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.signUp(email, password);
      if (error) throw error;
      
      if (data.user?.identities?.length === 0) {
        throw new Error('Email já cadastrado');
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Erro no signup:', error);
      return { data: null, error };
    }
  }

  async logout() {
    await this.supabase.signOut();
    this.authState.next(false);
    localStorage.clear(); // Limpar todos os dados do cache
    await this.router.navigate(['/kiosk']); // Redirecionar para página pública
  }

  updateAuthState(isAuthenticated: boolean) {
    console.log('Updating auth state:', isAuthenticated);
    this.authState.next(isAuthenticated);
  }

  private async checkAuth() {
    try {
      const { data: { user } } = await this.supabase.getCurrentUser();
      const isAuth = !!user;
      this.authState.next(isAuth);
      
      // Só redireciona para login se tentar acessar área administrativa
      if (!isAuth && window.location.pathname.includes('/admin')) {
        await this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      this.authState.next(false);
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user } } = await this.supabase.getCurrentUser();
      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  isAuthenticated() {
    return this.authState.asObservable();
  }
}
