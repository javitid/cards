import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { Card, CardResponse, Credentials } from '../modules/card/interfaces/card';
import { environment } from '../../environments/environment';

let cards: Observable<Card[]>;

const LEVEL = {
  EASY: 'easy',
  PRUEBA: 'prueba'
}

const requestHeaders = {
  'Accept': 'application/json'
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  httpError?: HttpErrorResponse;
  
  constructor(private http: HttpClient) { }

  getOpenAICredentials(): Observable<Credentials> {
    return this.http.get<Credentials>(environment.urlOpenAICredentials, {headers: requestHeaders}).pipe(
      shareReplay(1)
    );
  }

  getCards(level = LEVEL.EASY): Observable<Card[]>{
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
    cards = this.http.post<CardResponse>(environment.urlFindCards, requestBody, {headers: requestHeaders}).pipe(
      map(result => result.documents),
      shareReplay(1)
    );
    return cards.pipe(
      map(arr => arr.sort())
    );
    return cards;
  }

  setCards(cards: Card[]) {
    const requestBody = {
      dataSource: 'Cluster0',
      database: 'cards',
      collection: LEVEL.EASY,
      documents: cards
    };

    return this.http.post<CardResponse>(environment.urlUploadCards, requestBody, {headers: requestHeaders}).pipe(
      map(result => result.documents),
      shareReplay(1)
    );
  }

  deleteCards() {
    const requestBody = {
      dataSource: 'Cluster0',
      database: 'cards',
      collection: LEVEL.EASY,
      filter: {}
    };

    return this.http.post<CardResponse>(environment.urlDeleteCards, requestBody, {headers: requestHeaders}).pipe(
      map(result => result.documents),
      shareReplay(1)
    );
  }

  getHttpError(): HttpErrorResponse|undefined  {
    return this.httpError;
  }

  setHttpError(error: HttpErrorResponse): void {
    this.httpError = error;
  }
}