import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

declare const FB: any;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  public form: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private _snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      username: ['', Validators.email],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchingValidatior });
  }

  async onSubmit() {
    if (this.form.valid) {
      try {
        this.authService.login(this.form.value).subscribe(
          (tokenBearer: any) => {
            this.authService.saveToken('Bearer ' + tokenBearer.access_token);
            this.router.navigate(['/game']);
          },
          (error: any) => {
            console.error(error);
            this._snackBar.open('Error with Username or Password', 'Close', {
              duration: 5000,
            });
          }
        );
      } catch (err) {
        this._snackBar.open('Error with Username or Password', 'Close', {
          duration: 5000,
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
