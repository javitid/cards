import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const isToken = !!this.authService.getToken();
    return of(isToken);
  }
}
