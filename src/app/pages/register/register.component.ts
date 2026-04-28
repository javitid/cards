import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { FirebaseError } from 'firebase/app';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  public form: any;
  public isPwdHidden = true;
  public isPwdRepeatedHidden = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      email: ['', Validators.email],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchingValidatior });
  }

  async onSubmit() {
    if (this.form.valid) {
      try {
        this.authService.register({
          email: this.form.value.email,
          password: this.form.value.password
        }).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Usuario creado',
              detail: 'La cuenta se ha creado correctamente',
              life: 5000,
            });
            this.router.navigate(['/login']);
          },
          error: (error: unknown) => {
            const firebaseError = error as FirebaseError;
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Firebase',
              detail: firebaseError.message,
              life: 10000,
            });
          }
        });
      } catch (err) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error de registro',
          detail: 'Error con el correo electrónico o la contraseña',
          life: 5000,
        });
      }
    } else {
    }
  }

  passwordMatchingValidatior: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
  
    return password?.value === confirmPassword?.value ? null : { notmatched: true };
  };
}
