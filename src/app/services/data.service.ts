import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
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

const FALLBACK_PAIRS: Pair[] = [
  { icon: 'house', es: 'casa', gb: 'house', it: 'casa', pt: 'casa', de: 'Haus' },
  { icon: '', es: 'coche', gb: 'car', it: 'macchina', pt: 'carro', de: 'Auto' },
  { icon: '', es: 'perro', gb: 'dog', it: 'cane', pt: 'cachorro', de: 'Hund' },
  { icon: '', es: 'gato', gb: 'cat', it: 'gatto', pt: 'gato', de: 'Katze' },
  { icon: '', es: 'arbol', gb: 'tree', it: 'albero', pt: 'arvore', de: 'Baum' },
  { icon: '', es: 'montana', gb: 'mountain', it: 'montagna', pt: 'montanha', de: 'Berg' },
  { icon: '', es: 'sol', gb: 'sun', it: 'sole', pt: 'sol', de: 'Sonne' },
  { icon: '', es: 'luna', gb: 'moon', it: 'luna', pt: 'lua', de: 'Mond' },
  { icon: 'water', es: 'agua', gb: 'water', it: 'acqua', pt: 'agua', de: 'Wasser' },
  { icon: '', es: 'fuego', gb: 'fire', it: 'fuoco', pt: 'fogo', de: 'Feuer' },
  { icon: '', es: 'amigo', gb: 'friend', it: 'amico', pt: 'amigo', de: 'Freund' },
  { icon: 'book', es: 'libro', gb: 'book', it: 'libro', pt: 'livro', de: 'Buch' },
];

@Injectable({
  providedIn: 'root'
})
export class DataService {
  httpError?: HttpErrorResponse;
  private readonly cardsCache = new Map<string, Observable<Card[]>>();
  private cardsSource: 'firestore' | 'fallback' = 'firestore';
  
  constructor(
    private readonly utilsService: UtilsService
  ) { }

  private getFallbackCards(languages: string[]): Card[] {
    return this.utilsService.generateCards(FALLBACK_PAIRS, languages);
  }

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
    const cacheKey = `${level}:${languages.join(',')}`;

    if (!this.cardsCache.has(cacheKey)) {
      const cardsRequest$ = from(getDocsFromServer(collection(db, level))).pipe(
        map((result) => result.docs.map((snapshot) => snapshot.data() as Pair)),
        map((documents) => {
          if (!documents.length) {
            this.cardsSource = 'fallback';
            return this.getFallbackCards(languages);
          }

          this.cardsSource = 'firestore';
          return this.utilsService.generateCards(documents, languages);
        }),
        catchError((error: HttpErrorResponse) => {
          this.setHttpError(error);
          this.cardsSource = 'fallback';
          return of(this.getFallbackCards(languages));
        }),
        shareReplay(1)
      );

      this.cardsCache.set(cacheKey, cardsRequest$);
    }

    return this.cardsCache.get(cacheKey)!;
  }

  setCards(cards: Pair[]): Observable<Pair[]> {
    const batch = writeBatch(db);
    const cardsCollection = collection(db, LEVEL.EASY);

    cards.forEach((card) => {
      batch.set(doc(cardsCollection), card);
    });

    return from(batch.commit()).pipe(
      map(() => cards),
      map((savedCards) => {
        this.cardsCache.clear();
        return savedCards;
      }),
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
          map(() => snapshots.docs.map((snapshot) => snapshot.data() as Pair)),
          map((deletedCards) => {
            this.cardsCache.clear();
            return deletedCards;
          })
        );
      }),
      shareReplay(1)
    );
  }

  getHttpError(): HttpErrorResponse|undefined  {
    return this.httpError;
  }

  getCardsSource(): 'firestore' | 'fallback' {
    return this.cardsSource;
  }

  setHttpError(error: HttpErrorResponse): void {
    this.httpError = error;
  }
}
