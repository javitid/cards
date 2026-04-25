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
    username: ['', Validators.email],
    password: ['', Validators.required],
  });

  async onSubmit() {
    if (this.form.valid) {
      this.authService.login(this.form.value).subscribe({
        next: () => {
          this.router.navigate(['/game']);
        },
        error: (error: unknown) => {
          console.error(error);
          this.messageService.add({
            severity: 'error',
            summary: 'Login error',
            detail: 'Error with Username or Password',
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
      error: (error: unknown) => {
        console.error(error);
        this.messageService.add({
          severity: 'error',
          summary: 'Google login error',
          detail: 'Error with Google login',
          life: 5000,
        });
      },
    });
  }
}
