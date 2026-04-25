import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { Observable, from, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

import { Card, Credentials, Pair } from '../modules/card/interfaces/card';
import { UtilsService } from '../utils/utils.service';
import { environment } from '../../environments/environment';
import { db } from '../utils/firebase';

const LEVEL = {
  EASY: 'easy',
  PRUEBA: 'prueba'
};

@Injectable({
  providedIn: 'root'
})
export class DataService {
  httpError?: HttpErrorResponse;
  
  constructor(
    private readonly utilsService: UtilsService
  ) { }

  getOpenAICredentials(): Observable<Credentials> {
    return from(getDoc(doc(db, 'config', 'openaiCredentials'))).pipe(
      map((result) => {
        const data = result.data() as Partial<Credentials> | undefined;
        return {
          apiKey: data?.apiKey || environment.openAICredentials.apiKey,
          organization: data?.organization || environment.openAICredentials.organization,
        };
      }),
      catchError(() => of(environment.openAICredentials)),
      shareReplay(1)
    );
  }

  getCards(languages: string[], level = LEVEL.EASY): Observable<Card[]>{
    return from(getDocs(collection(db, level))).pipe(
      map((result) => result.docs.map((snapshot) => snapshot.data() as Pair)),
      map((documents) => this.utilsService.generateCards(documents, languages)),
      shareReplay(1)
    );
  }

  setCards(cards: Pair[]): Observable<Pair[]> {
    const batch = writeBatch(db);
    const cardsCollection = collection(db, LEVEL.EASY);

    cards.forEach((card) => {
      batch.set(doc(cardsCollection), card);
    });

    return from(batch.commit()).pipe(
      map(() => cards),
      shareReplay(1)
    );
  }

  deleteCards() {
    const cardsCollection = collection(db, LEVEL.EASY);

    return from(getDocs(cardsCollection)).pipe(
      switchMap((snapshots) => {
        const batch = writeBatch(db);
        snapshots.docs.forEach((snapshot) => batch.delete(snapshot.ref));

        return from(batch.commit()).pipe(
          map(() => snapshots.docs.map((snapshot) => snapshot.data() as Pair))
        );
      }),
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