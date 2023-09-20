import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { Card, CardResponse, Credentials, Pair } from '../modules/card/interfaces/card';
import { UtilsService } from '../utils/utils.service';
import { environment } from '../../environments/environment';

const cards: Map<string, Observable<Card[]>> = new Map();

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
  
  constructor(
    private readonly http: HttpClient,
    private readonly utilsService: UtilsService
  ) { }

  getOpenAICredentials(): Observable<Credentials> {
    return this.http.get<Credentials>(environment.urlOpenAICredentials, {headers: requestHeaders}).pipe(
      shareReplay(1)
    );
  }

  getCards(languages: string[], level = LEVEL.EASY): Observable<Card[]>{
    const projection: { [key: string]: number } = {
      id: 1,
      icon: 2,
      es: 3
    };

    // Add languages
    languages.forEach((lang, index) => {
      projection[lang] = index+4;
    });

    const requestBody = {
      dataSource: 'Cluster0',
      database: 'cards',
      collection: level,
      projection: projection
    };

    return this.http.post<CardResponse>(environment.urlFindCards, requestBody, {headers: requestHeaders}).pipe(
      map(result => {
        return this.utilsService.generateCards(result.documents, languages);
      }),
      shareReplay(1)
    );

    // TODO: Add cache to the request
    // if (!cards.get(level)) {
    //   const cards$ = this.http.post<CardResponse>(environment.urlFindCards, requestBody, {headers: requestHeaders}).pipe(
    //     map(result => {
    //       return this.utilsService.generateCards(result.documents, languages);
    //     }),
    //     shareReplay(1)
    //   );
    //   cards.set(level, cards$);
    // }
    // return cards.get(level) || of();
  }

  setCards(cards: Pair[]) {
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