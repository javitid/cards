import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CredentialResponse, PromptMomentNotification } from 'google-one-tap';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

declare const FB: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private clientId = environment.clientId;
  public isPwdHidden = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private _ngZone: NgZone,
    private fb: FormBuilder,
    private _snackBar: MatSnackBar
  ) {}

  form = this.fb.group({
    username: ['', Validators.email],
    password: ['', Validators.required],
  });

  ngOnInit(): void {
    // Show button when the user is already logged in and the path has changed
    // @ts-ignore
    if(window.google) {
      // @ts-ignore
      window.google.accounts.id.renderButton(
        document.getElementById('buttonDiv') as HTMLElement,
        { theme: 'outline', size: 'large' }
      );
    }

    (window as any).onGoogleLibraryLoad = () => {
      // @ts-ignore
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // @ts-ignore
      google.accounts.id.renderButton(
        document.getElementById('buttonDiv') as HTMLElement,
        { theme: 'outline', size: 'large'}
      );
      // @ts-ignore
      google.accounts.id.prompt((notification: PromptMomentNotification) => undefined);
    };
  }

  async handleCredentialResponse(response: CredentialResponse) {
    await this.authService.LoginWithGoogle(response.credential).subscribe(
      (x: any) => {
        this._ngZone.run(() => {
          this.router.navigate(['/logout']);
        });
      },
      (error: any) => {
        console.log(error);
      }
    );
  }

  async onSubmit() {
    //this.formSubmitAttempt = false;
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
      //this.formSubmitAttempt = true;
    }
  }

  async login() {
    FB.login(
      async (result: any) => {
        await this.authService
          .LoginWithFacebook(result.authResponse.accessToken)
          .subscribe(
            (x: any) => {
              this._ngZone.run(() => {
                this.router.navigate(['/logout']);
              });
            },
            (error: any) => {
              console.log(error);
            }
          );
      },
      { scope: 'email' }
    );
  }
}
