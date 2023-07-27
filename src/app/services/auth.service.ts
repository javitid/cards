import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  saveToken(token: string) {
    sessionStorage.setItem('token', token);
  }

  getToken(): string {
    return sessionStorage.getItem('token') || '';
  }
}
