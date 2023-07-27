import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthMongoDBGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private http: HttpClient
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const requestBody = {'key': environment.mongoDBApiKey};
    if(this.authService.getToken()) { return of(true) }

    return this.http.post<string>(environment.urlBearerToken, requestBody).pipe(
      shareReplay(1),
      map((tokenBearer: any) => {
        this.authService.saveToken('Bearer ' + tokenBearer.access_token);
        return of(!!tokenBearer)
      })
    );
  }

}
