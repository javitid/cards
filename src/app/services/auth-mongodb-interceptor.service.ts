/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from './auth.service';

@Injectable()
export class AuthMongoDBInterceptorService implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    const headers = req.headers.set('Authorization', this.authService.getToken());
    return next.handle(req.clone({ headers })).pipe(
      catchError((event: any) => {
        if(event.status === 401) {
          this.authService.saveToken('');
          const snackBarRef = this.snackBar.open('Authentication token expired', 'Click to reload', {
            duration: 10000,
          });

          snackBarRef.afterDismissed().subscribe(() => {
            location.reload();
          });
        }
        return throwError(event);
      })
    );
  }
}
