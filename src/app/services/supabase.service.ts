import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private static instance: SupabaseService;
  private supabase!: SupabaseClient;
  private _session = new BehaviorSubject<any>(null);

  constructor(private router: Router) {
    if (SupabaseService.instance) {
      return SupabaseService.instance;
    }

    this.initSupabase();
    this.loadSession(); // Add initial session load
    SupabaseService.instance = this;
  }

  private initSupabase() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          storage: window.localStorage,
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'app-hoje.auth.token'
        }
      }
    );

    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      this._session.next(session);
      
      if (event === 'SIGNED_IN') {
        console.log('Usuário logado');
        this.router.navigate(['/admin/employee']);
      } else if (event === 'SIGNED_OUT') {
        window.localStorage.removeItem('app-hoje.auth.token');
        this.router.navigate(['/login']);
      }
    });
  }

  private async loadSession() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        this._session.next(session);
        if (window.location.pathname === '/login') {
          this.router.navigate(['/admin/employee']);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      this._session.next(null);
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;

      if (data.session) {
        this._session.next(data.session);
        return { data, error: null };
      }

      throw new Error('Sessão não criada');
    } catch (error) {
      console.error('Erro no login:', error);
      return { data: null, error };
    }
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
    }
    this._session.next(null);
    window.localStorage.removeItem('supabase.auth.token');
    return { error };
  }

  async getCurrentUser() {
    return await this.supabase.auth.getUser();
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) console.error('Erro signup:', error);
    return { data, error };
  }

  get session() {
    return this._session.asObservable();
  }

  async refreshSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) {
      console.error('Erro ao atualizar sessão:', error);
      return null;
    }
    this._session.next(session);
    return session;
  }
}