import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

import { Card, Credentials, GameLevelId, Pair, ScoreEntry, ScoreSubmission } from '../modules/card/interfaces/card';
import { UtilsService } from '../utils/utils.service';
import { environment } from '../../environments/environment';
import { db } from '../utils/firebase';
import { LoggerService } from './logger.service';

const LEVEL = {
  EASY: 'easy' as GameLevelId,
  MEDIUM: 'medium' as GameLevelId,
  HARD: 'hard' as GameLevelId,
  PRUEBA: 'prueba'
};
const LEADERBOARD_COLLECTION = 'leaderboards';

const FIREBASE_PLACEHOLDER_PREFIXES = ['YOUR_FIREBASE_', 'FIREBASE_'];

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
  httpError?: Error | HttpErrorResponse;
  private readonly cardsCache = new Map<string, Observable<Card[]>>();
  private readonly leaderboardCache = new Map<string, Observable<ScoreEntry[]>>();
  private cardsSource: 'firestore' | 'fallback' = 'firestore';
  private cardsSourceReason = 'Conectado a Firestore.';
  
  constructor(
    private readonly utilsService: UtilsService,
    private readonly logger: LoggerService
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

  getCards(languages: string[], level: GameLevelId = LEVEL.EASY): Observable<Card[]>{
    const cacheKey = `${level}:${languages.join(',')}`;

    if (!this.cardsCache.has(cacheKey)) {
      if (!this.hasFirebaseConfig()) {
        this.cardsSource = 'fallback';
        this.cardsSourceReason = 'La configuracion de Firebase usa placeholders. En local usa start:local; en GitHub Pages revisa la inyeccion de secrets en Actions.';
        this.logger.warn('Falling back to local cards because Firebase config still has placeholders.');

        const fallbackCards$ = of(this.getFallbackCards(languages)).pipe(
          shareReplay({ bufferSize: 1, refCount: true })
        );

        this.cardsCache.set(cacheKey, fallbackCards$);
        return fallbackCards$;
      }

      const cardsRequest$ = new Observable<Card[]>((subscriber) => {
        const unsubscribe = onSnapshot(
          collection(db, level),
          (result) => {
            const documents = result.docs.map((snapshot) => snapshot.data() as Pair);

            if (!documents.length) {
              this.cardsSource = 'fallback';
              this.cardsSourceReason = `La coleccion "${level}" de Firestore esta vacia.`;
              this.logger.warn(`Firestore collection "${level}" returned no documents. Using fallback cards.`);
              subscriber.next(this.getFallbackCards(languages));
              return;
            }

            this.cardsSource = 'firestore';
            this.cardsSourceReason = `Cargados ${documents.length} registros desde la coleccion "${level}" de Firestore.`;
            subscriber.next(this.utilsService.generateCards(documents, languages));
          },
          (error) => {
            this.setHttpError(error as Error);
            this.cardsSource = 'fallback';
            this.cardsSourceReason = this.getFirestoreErrorMessage(level, error as Error);
            this.logger.error('Firestore request failed. Using fallback cards.', error);
            subscriber.next(this.getFallbackCards(languages));
            subscriber.complete();
          }
        );

        return () => unsubscribe();
      }).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );

      this.cardsCache.set(cacheKey, cardsRequest$);
    }

    return this.cardsCache.get(cacheKey)!;
  }

  setCards(cards: Pair[], level: GameLevelId = LEVEL.EASY): Observable<Pair[]> {
    const batch = writeBatch(db);
    const cardsCollection = collection(db, level);

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

  deleteCards(level: GameLevelId = LEVEL.EASY) {
    const cardsCollection = collection(db, level);

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

  getTopScores(language: string, level: GameLevelId, amount = 5): Observable<ScoreEntry[]> {
    const cacheKey = `${language}:${level}:${amount}`;

    if (!this.leaderboardCache.has(cacheKey)) {
      if (!this.hasFirebaseConfig()) {
        const fallbackScores$ = of([] as ScoreEntry[]).pipe(
          shareReplay({ bufferSize: 1, refCount: true })
        );

        this.leaderboardCache.set(cacheKey, fallbackScores$);
        return fallbackScores$;
      }

      const scoresRequest$ = new Observable<ScoreEntry[]>((subscriber) => {
        const scoresQuery = query(
          collection(db, LEADERBOARD_COLLECTION, language, 'levels', level, 'times'),
          orderBy('durationSeconds', 'asc'),
          limit(amount)
        );

        const unsubscribe = onSnapshot(
          scoresQuery,
          (result) => {
            subscriber.next(result.docs
              .map((snapshot) => {
                const data = snapshot.data() as Omit<ScoreEntry, 'id'>;

                return {
                id: snapshot.id,
                ...data,
                level: data.level || level
              };
              })
              .sort((left, right) => {
                if (left.durationSeconds !== right.durationSeconds) {
                  return left.durationSeconds - right.durationSeconds;
                }

                return left.createdAt - right.createdAt;
              }));
          },
          (error) => {
            this.logger.error('Firestore leaderboard request failed.', error);
            subscriber.next([]);
            subscriber.complete();
          }
        );

        return () => unsubscribe();
      }).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );

      this.leaderboardCache.set(cacheKey, scoresRequest$);
    }

    return this.leaderboardCache.get(cacheKey)!;
  }

  saveScore(score: ScoreSubmission): Observable<void> {
    if (!this.hasFirebaseConfig()) {
      return throwError(() => new Error('El ranking no esta disponible mientras Firebase use placeholders.'));
    }

    return from(addDoc(collection(db, LEADERBOARD_COLLECTION, score.language, 'levels', score.level, 'times'), {
      ...score,
      createdAt: Date.now()
    })).pipe(
      map(() => undefined)
    );
  }

  getHttpError(): Error | HttpErrorResponse | undefined  {
    return this.httpError;
  }

  getCardsSource(): 'firestore' | 'fallback' {
    return this.cardsSource;
  }

  getCardsSourceReason(): string {
    return this.cardsSourceReason;
  }

  setHttpError(error: Error | HttpErrorResponse): void {
    this.httpError = error;
  }

  private hasFirebaseConfig(): boolean {
    return !Object.values(environment.firebase).some((value) =>
      FIREBASE_PLACEHOLDER_PREFIXES.some((prefix) => value.startsWith(prefix))
    );
  }

  private getFirestoreErrorMessage(level: string, error: Error): string {
    const message = error.message || 'Error desconocido de Firestore.';

    if (message.toLowerCase().includes('permission')) {
      return `Los permisos de Firestore han bloqueado el acceso a "${level}". Revisa las reglas de seguridad.`;
    }

    return `Error de Firestore al leer "${level}": ${message}`;
  }
}
