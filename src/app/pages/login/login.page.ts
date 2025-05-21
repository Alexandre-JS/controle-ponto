import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs/operators';
import { WelcomeModalComponent } from '../../components/welcome-modal/welcome-modal.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, WelcomeModalComponent]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private modalController: ModalController
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
        
        await this.authService.login(
          this.loginForm.value.email,
          this.loginForm.value.password
        );

        // Mostra o modal de boas-vindas
        await this.showWelcomeModal();
        
        await this.router.navigate(['/admin/daily-attendance'], { replaceUrl: true });
      } catch (error: any) {
        console.error('Login error:', error);
        
        if (error.message?.includes('Invalid login credentials')) {
          this.showToast('Email ou senha incorretos', 'danger');
        } else if (error.message?.includes('Email not confirmed')) {
          this.showToast('Por favor, confirme seu email antes de fazer login', 'warning');
        } else {
          this.showToast(error.message || 'Erro ao fazer login', 'danger');
        }
      } finally {
        this.isLoading = false;
      }
    }
  }

  private async showWelcomeModal() {
    const modal = await this.modalController.create({
      component: WelcomeModalComponent,
      componentProps: {
        title: 'Bem-vindo!',
        message: 'Login realizado com sucesso. Redirecionando...'
      },
      cssClass: 'welcome-modal',
      breakpoints: undefined,
      initialBreakpoint: undefined,
      backdropDismiss: false,
      showBackdrop: true
    });

    await modal.present();

    // Aguarda 2 segundos e fecha automaticamente
    setTimeout(async () => {
      await modal.dismiss();
    }, 2000);
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
