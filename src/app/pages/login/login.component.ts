import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  public isPwdHidden = true;

  constructor(
    private readonly authService: AuthService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly messageService: MessageService
  ) {}

  form = this.fb.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async onSubmit() {
    if (this.form.valid) {
      this.authService.login(this.form.value).subscribe({
        next: () => {
          this.router.navigate(['/game']);
        },
        error: (error: any) => {
          console.error('Error de acceso:', error);
          console.error('Código de error:', error?.code);
          console.error('Mensaje de error:', error?.message);
          this.messageService.add({
            severity: 'error',
            summary: 'Error de acceso',
            detail: error?.message || 'No se ha podido iniciar sesión con correo y contraseña.',
            life: 5000,
          });
        },
      });
    }
  }

  loginWithGoogle() {
    this.authService.LoginWithGoogle().subscribe({
      next: () => {
        this.router.navigate(['/game']);
      },
      error: (error: any) => {
        console.error('Error de acceso con Google:', error);
        console.error('Código de error:', error?.code);
        console.error('Mensaje de error:', error?.message);
        this.messageService.add({
          severity: 'error',
          summary: 'Error con Google',
          detail: error?.message || 'No se ha podido iniciar sesión con Google.',
          life: 5000,
        });
      },
    });
  }

  loginAsGuest() {
    this.authService.loginAsGuest().subscribe({
      next: () => {
        this.router.navigate(['/game']);
      },
      error: (error: any) => {
        console.error('Error de acceso como invitado:', error);
        console.error('Código de error:', error?.code);
        console.error('Mensaje de error:', error?.message);
        this.messageService.add({
          severity: 'error',
          summary: 'Error de acceso invitado',
          detail: error?.message || 'No se ha podido entrar como invitado.',
          life: 5000,
        });
      },
    });
  }
}
