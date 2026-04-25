import { Injectable } from '@angular/core';
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
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { auth } from '../utils/firebase';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loginStatus = new BehaviorSubject<boolean>(this.loggedIn());
  private username = new BehaviorSubject<string>(
    sessionStorage.getItem('username')!
  );

  constructor() {
    setPersistence(auth, browserSessionPersistence).catch((error) => {
      console.error('Could not set Firebase session persistence', error);
    });

    onIdTokenChanged(auth, async (user) => {
      if (!user) {
        this.saveToken('');
        this.saveUsername('');
        this.setLoginStatus(false);
        return;
      }

      const token = await user.getIdToken();
      this.saveToken(token);
      this.saveUsername(user.email || (user.isAnonymous ? 'Invitado' : ''));
      this.setLoginStatus(true);
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
    return this.username.asObservable();
  }

  getLoginStatus(): Observable<boolean> {
    return this.loginStatus.asObservable();
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
      return throwError(() => new Error('Email and password are required'));
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

  saveUsername(username: string) {
    sessionStorage.setItem('username', username);
  }

  loggedIn(): boolean {
    if (sessionStorage.getItem('token')) {
      return true;
    }
    return false;
  }

  setLoginStatus(val: any) {
    this.loginStatus.next(val);
  }

  setUsername(val: any) {
    this.username.next(val);
  }
}
