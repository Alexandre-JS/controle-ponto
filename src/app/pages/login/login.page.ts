import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async ngOnInit() {
    const isAuth = await this.authService.isAuthenticated().pipe(take(1)).toPromise();
    if (isAuth) {
      await this.router.navigate(['/admin/employee']);
    }
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      try {
        this.isLoading = true;
        const { email, password } = this.loginForm.value;
        
        const error = await this.authService.login(email, password);

        if (error) {
          let message = 'Email ou senha incorretos';
          this.showToast(message, 'danger');
          return;
        }

        this.showToast('Login realizado com sucesso!', 'success');
        // Redirecionamento é feito pelo AuthService
      } catch (error: any) {
        console.error('Erro no login:', error);
        this.showToast('Erro ao fazer login', 'danger');
      } finally {
        this.isLoading = false;
      }
    }
  }

  async registerAdmin() {
    this.isLoading = true;
    try {
      const { data, error } = await this.authService.signUp('alexandre@equipmoz.org', '123456');
      
      if (error) {
        console.error('Erro detalhado:', error);
        this.showToast(error.message || 'Erro ao registrar', 'danger');
        return;
      }

      if (data?.user) {
        this.showToast('Admin registrado! Verifique seu email.', 'success');
      } else {
        this.showToast('Erro inesperado no registro', 'danger');
      }
    } catch (error: any) {
      console.error('Erro catch:', error);
      this.showToast(error.message || 'Erro ao registrar admin', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }
}
