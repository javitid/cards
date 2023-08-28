import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loginStatus = new BehaviorSubject<boolean>(this.loggedIn());
  private username = new BehaviorSubject<string>(
    sessionStorage.getItem('username')!
  );
  private path = environment.apiUrl;

  constructor( private httpClient: HttpClient ) {}

  public signOutExternal = () => {
    sessionStorage.removeItem('token');
    console.log('token deleted');
  };

  LoginWithGoogle(credentials: string): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    const loginModel = {
      authCode: credentials
    }

    return this.httpClient.post(
      this.path + 'oauth2-google/login',
      JSON.stringify(loginModel),
      { headers: header, withCredentials: true }
    );
  }

  LoginWithFacebook(credentials: string): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.post(
      this.path + 'oauth2-facebook/login',
      JSON.stringify(credentials),
      { headers: header, withCredentials: true }
    );
  }

  login(loginModel: any): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');

    return this.httpClient.post(
      this.path + 'local-userpass/login',
      JSON.stringify(loginModel),
      { headers: header, withCredentials: true }
    );
  }

  register(loginModel: any): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');

    return this.httpClient.post(
      this.path + 'local-userpass/register',
      JSON.stringify(loginModel),
      { headers: header, withCredentials: false }
    );
  }

  getClient(): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.get(this.path + 'GetColorList', {
      headers: header,
      withCredentials: true,
    });
  }

  refreshToken(): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.get(this.path + 'RefreshToken', {
      headers: header,
      withCredentials: true,
    });
  }

  revokeToken(): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.delete(
      this.path + 'RevokeToken/' + this.username.value,
      { headers: header, withCredentials: true }
    );
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
