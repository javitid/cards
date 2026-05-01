import { Injectable, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  UserCredential,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendEmailVerification,
  setPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { Observable, from, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

import { auth } from '../utils/firebase';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly loginStatus = signal<boolean>(this.loggedIn());
  readonly username = signal<string>(sessionStorage.getItem('username') || '');

  constructor(private readonly logger: LoggerService) {
    setPersistence(auth, browserSessionPersistence).catch((error) => {
      this.logger.error('Could not set Firebase session persistence', error);
    });

    onIdTokenChanged(auth, async (user) => {
      if (!user) {
        this.saveToken('');
        this.saveUsername('');
        this.loginStatus.set(false);
        return;
      }

      const token = await user.getIdToken();
      this.saveToken(token);
      this.saveUsername(user.email || (user.isAnonymous ? 'Invitado' : ''));
      this.loginStatus.set(true);
    });
  }

  public logout(): void {
    signOut(auth).finally(() => {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('username');
      this.setLoginStatus(false);
    });
  }

  public signOutExternal = () => {
    this.logout();
  };

  getUsername(): Observable<string> {
    return toObservable(this.username);
  }

  getLoginStatus(): Observable<boolean> {
    return toObservable(this.loginStatus);
  }

  isLoggedIn(): boolean {
    return this.loginStatus();
  }

  LoginWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(auth, provider));
  }

  loginAsGuest(): Observable<UserCredential> {
    return from(signInAnonymously(auth));
  }

  login(loginModel: {
    username?: string | null;
    email?: string | null;
    password?: string | null;
  }): Observable<UserCredential> {
    const email = loginModel.email || loginModel.username;
    const password = loginModel.password;

    if (!email || !password) {
      return throwError(() => new Error('Se necesitan correo y contraseña.'));
    }

    return from(signInWithEmailAndPassword(auth, email, password));
  }

  register(loginModel: { email: string; password: string }): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(auth, loginModel.email, loginModel.password)).pipe(
      switchMap((credentials) =>
        from(sendEmailVerification(credentials.user)).pipe(map(() => credentials))
      )
    );
  }

  confirmUser(): Observable<{ ok: boolean }> {
    return of({ ok: true });
  }

  saveToken(token: string) {
    sessionStorage.setItem('token', token);
  }

  getToken(): string {
    return sessionStorage.getItem('token') || '';
  }

  getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  isAnonymousUser(): boolean {
    return Boolean(auth.currentUser?.isAnonymous);
  }

  saveUsername(username: string) {
    sessionStorage.setItem('username', username);
    this.username.set(username);
  }

  loggedIn(): boolean {
    if (sessionStorage.getItem('token')) {
      return true;
    }
    return false;
  }

  setLoginStatus(val: any) {
    this.loginStatus.set(Boolean(val));
  }

  setUsername(val: any) {
    this.username.set(String(val || ''));
  }
}
