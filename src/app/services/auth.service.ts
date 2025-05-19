import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<boolean>(false);
  private readonly AUTH_KEY = 'auth_session';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth() {
    const session = localStorage.getItem(this.AUTH_KEY);
    if (session) {
      this.authStateSubject.next(true);
    }
  }

  async login(email: string, password: string) {
    try {
      const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.session) {
        localStorage.setItem(this.AUTH_KEY, JSON.stringify(data.session));
        this.authStateSubject.next(true);
        await this.router.navigate(['/admin/employee']);
        return null;
      }

      throw new Error('Erro ao fazer login');
    } catch (error: any) {
      this.authStateSubject.next(false);
      console.error('Erro login:', error);
      return error.message || 'Erro ao fazer login';
    }
  }

  checkAuthentication() {
    return this.supabaseService.session.pipe(
      map(session => {
        const isAuth = !!session;
        this.authStateSubject.next(isAuth);
        return isAuth;
      })
    );
  }

  async signUp(email: string, password: string) {
    try {
      const { data, error } = await this.supabaseService.signUp(email, password);
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
    const { error } = await this.supabaseService.getClient().auth.signOut();
    localStorage.removeItem(this.AUTH_KEY);
    this.authStateSubject.next(false);

    if (error) {
      console.error('Logout error:', error);
      throw error;
    }

    await this.router.navigate(['/kiosk']); // Redirecionar para página pública
  }

  updateAuthState(isAuthenticated: boolean) {
    console.log('Updating auth state:', isAuthenticated);
    this.authStateSubject.next(isAuthenticated);
  }

  private async checkAuth() {
    try {
      const { data: { user } } = await this.supabaseService.getCurrentUser();
      const isAuth = !!user;
      this.authStateSubject.next(isAuth);

      // Só redireciona para login se tentar acessar área administrativa
      if (!isAuth && window.location.pathname.includes('/admin')) {
        await this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      this.authStateSubject.next(false);
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user } } = await this.supabaseService.getCurrentUser();
      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  isAuthenticated(): Observable<boolean> {
    return this.authStateSubject.asObservable();
  }
}
