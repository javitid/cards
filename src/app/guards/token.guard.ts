import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class TokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.authService.isLoggedIn();
  }
}
