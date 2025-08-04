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
        },
        global: {
          headers: {
            'Accept': 'application/json, */*',
            'Content-Type': 'application/json',
            'apikey': environment.supabaseKey,
            'X-Client-Info': 'app-hoje@1.0.0'
          }
        }
      }
    );

    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      this._session.next(session);
      
      if (event === 'SIGNED_IN') {
        console.log('Usuário logado');
        this.router.navigate(['/admin/daily-attendance']);
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
          this.router.navigate(['/admin/daily-attendance']);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      this._session.next(null);
    }
  }

  getClient(): SupabaseClient {
    // Verificar se o cliente está inicializado, se não estiver, inicializar novamente
    if (!this.supabase) {
      console.warn('Cliente Supabase não inicializado. Inicializando novamente...');
      this.initSupabase();
    }
    return this.supabase;
  }
  
  /**
   * Reinicializa o cliente Supabase em caso de problemas de conexão
   * Útil quando o cliente está em um estado inválido ou quando ocorrem erros 406/400
   */
  // reinitializeClient(): SupabaseClient {
  //   console.log('Reinicializando cliente Supabase...');
  //   this.initSupabase();
  //   return this.supabase;
  // }

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

  /**
   * Verifica se uma tabela existe no Supabase
   * @param tableName Nome da tabela a verificar
   * @returns true se a tabela existe e está acessível
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(tableName)
        .select('count', { count: 'exact', head: true })
        .limit(0);
        
      return !error;
    } catch (e) {
      console.error(`Erro ao verificar tabela ${tableName}:`, e);
      return false;
    }
  }
  
  /**
   * Reinicializa o cliente Supabase em caso de problemas com headers ou autenticação
   * Útil para resolver problemas de 406 Not Acceptable e 400 Bad Request
   */
  reinitializeClient(): SupabaseClient {
    console.log('Reinicializando cliente Supabase para resolver problemas de conexão...');
    this.initSupabase();
    
    // Forçar novos headers para evitar problemas de 406 Not Acceptable
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          storage: window.localStorage,
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'app-hoje.auth.token'
        },
        global: {
          headers: {
            'Accept': 'application/json, */*',
            'Content-Type': 'application/json',
            'apikey': environment.supabaseKey,
            'X-Client-Info': 'app-hoje@1.0.0'
          }
        }
      }
    );
    
    return this.supabase;
  }
  
  /**
   * Executa um diagnóstico rápido da conexão com Supabase
   * @returns Informações de diagnóstico
   */
  async diagnoseConnection(): Promise<{ 
    status: string, 
    error?: string, 
    headers?: any 
  }> {
    try {
      // Testar uma requisição básica ao Supabase
      const { data, error } = await this.supabase
        .from('employees')
        .select('count', { count: 'exact', head: true })
        .limit(0);
        
      if (error) {
        return {
          status: 'error',
          error: `Erro API: ${error.message} (${error.code || 'sem código'})`
        };
      }
      
      return {
        status: 'ok',
        headers: {
          // Mostrar informações de headers usados
          'apikey': 'presente (censurado)',
          'Content-Type': 'application/json',
          'Accept': 'application/json, */*'
        }
      };
    } catch (e) {
      return {
        status: 'exception',
        error: e instanceof Error ? e.message : 'Erro desconhecido'
      };
    }
  }
}