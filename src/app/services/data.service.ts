import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { Card, CardResponse } from '../modules/card/interfaces/card';
import { environment } from '../../environments/environment';

let cards: Observable<Card[]>;

@Injectable({
  providedIn: 'root'
})
export class DataService {
  httpError?: HttpErrorResponse;
  
  constructor(private http: HttpClient) { }

  getCards(level = 'easy'): Observable<Card[]>{
    const requestHeaders = {
      'Accept': 'application/json',
    }

    const requestBody = {
      dataSource: 'Cluster0',
      database: 'cards',
      collection: level,
      projection: {
        id: 1,
        icon: 2,
        pair: 3,
        value: 4,
        match: 5
      }
    };
    cards = this.http.post<CardResponse>(environment.urlPostCards, requestBody, {headers: requestHeaders}).pipe(
      map(result => result.documents),
      shareReplay(1)
    );
    return cards;
  }

  getHttpError(): HttpErrorResponse|undefined  {
    return this.httpError;
  }

  setHttpError(error: HttpErrorResponse): void {
    this.httpError = error;
  }
}