import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  addDoc,
  collection,
  CollectionReference,
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

import {
  AntonymPair,
  AppGameId,
  Card,
  Credentials,
  GameLevelId,
  LanguageCode,
  LanguagePair,
  ScoreEntry,
  ScoreSubmission,
  SynonymPair
} from '../modules/card/interfaces/card';
import { UtilsService } from '../utils/utils.service';
import { environment } from '../../environments/environment';
import { db } from '../utils/firebase';
import { LoggerService } from './logger.service';
const LEADERBOARD_COLLECTION = 'leaderboards';
const LEADERBOARD_BY_GAME_COLLECTION = 'leaderboardsByGame';
const GAMES_COLLECTION = 'games';
const DEFAULT_GAME: AppGameId = 'languages';
const DEFAULT_LANGUAGE: LanguageCode = 'gb';

const FIREBASE_PLACEHOLDER_PREFIXES = ['YOUR_FIREBASE_', 'FIREBASE_'];

const FALLBACK_LANGUAGE_PAIRS: LanguagePair[] = [
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
const FALLBACK_SYNONYM_PAIRS: SynonymPair[] = [
  { icon: '', left: 'alegre', right: 'contento' },
  { icon: '', left: 'coche', right: 'automovil' },
  { icon: '', left: 'empezar', right: 'comenzar' },
  { icon: '', left: 'terminar', right: 'acabar' },
  { icon: '', left: 'bonito', right: 'hermoso' },
  { icon: '', left: 'rapido', right: 'veloz' },
  { icon: '', left: 'hablar', right: 'conversar' },
  { icon: '', left: 'enorme', right: 'gigante' },
  { icon: '', left: 'facil', right: 'sencillo' },
  { icon: '', left: 'feliz', right: 'dichoso' },
  { icon: '', left: 'enojado', right: 'molesto' },
  { icon: '', left: 'cuidar', right: 'proteger' },
];
const FALLBACK_ANTONYM_PAIRS: AntonymPair[] = [
  { icon: '', left: 'alto', right: 'bajo' },
  { icon: '', left: 'grande', right: 'pequeno' },
  { icon: '', left: 'rapido', right: 'lento' },
  { icon: '', left: 'encender', right: 'apagar' },
  { icon: '', left: 'entrar', right: 'salir' },
  { icon: '', left: 'feliz', right: 'triste' },
  { icon: '', left: 'cerca', right: 'lejos' },
  { icon: '', left: 'fuerte', right: 'debil' },
  { icon: '', left: 'limpio', right: 'sucio' },
  { icon: '', left: 'nuevo', right: 'viejo' },
  { icon: '', left: 'abrir', right: 'cerrar' },
  { icon: '', left: 'subir', right: 'bajar' },
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

  private getFallbackCards(gameId: AppGameId, language: LanguageCode): Card[] {
    if (gameId === 'synonyms') {
      return this.utilsService.generateSynonymCards(FALLBACK_SYNONYM_PAIRS);
    }

    if (gameId === 'antonyms') {
      return this.utilsService.generateSynonymCards(FALLBACK_ANTONYM_PAIRS);
    }

    return this.utilsService.generateLanguageCards(FALLBACK_LANGUAGE_PAIRS, language);
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

  getCards(gameId: AppGameId = DEFAULT_GAME, language: LanguageCode = DEFAULT_LANGUAGE, level: GameLevelId = 'easy'): Observable<Card[]>{
    const cacheKey = `${gameId}:${level}:${language}`;

    if (!this.cardsCache.has(cacheKey)) {
      if (!this.hasFirebaseConfig()) {
        this.cardsSource = 'fallback';
        this.cardsSourceReason = 'La configuracion de Firebase usa placeholders. En local usa start:local; en GitHub Pages revisa la inyeccion de secrets en Actions.';
        this.logger.warn('Falling back to local cards because Firebase config still has placeholders.');

        const fallbackCards$ = of(this.getFallbackCards(gameId, language)).pipe(
          shareReplay({ bufferSize: 1, refCount: true })
        );

        this.cardsCache.set(cacheKey, fallbackCards$);
        return fallbackCards$;
      }

      const cardsRequest$ = new Observable<Card[]>((subscriber) => {
        const collectionRef = this.getCardsCollection(gameId, level);
        const unsubscribe = onSnapshot(
          collectionRef,
          (result) => {
            const documents = result.docs.map((snapshot) => snapshot.data());

            if (!documents.length) {
              this.cardsSource = 'fallback';
              this.cardsSourceReason = `La coleccion "${this.getCardsCollectionLabel(gameId, level)}" de Firestore esta vacia.`;
              this.logger.warn(`Firestore collection "${this.getCardsCollectionLabel(gameId, level)}" returned no documents. Using fallback cards.`);
              subscriber.next(this.getFallbackCards(gameId, language));
              return;
            }

            this.cardsSource = 'firestore';
            this.cardsSourceReason = `Cargados ${documents.length} registros desde la coleccion "${this.getCardsCollectionLabel(gameId, level)}" de Firestore.`;
            subscriber.next(this.mapCardsForGame(gameId, documents, language));
          },
          (error) => {
            this.setHttpError(error as Error);
            this.cardsSource = 'fallback';
            this.cardsSourceReason = this.getFirestoreErrorMessage(this.getCardsCollectionLabel(gameId, level), error as Error);
            this.logger.error('Firestore request failed. Using fallback cards.', error);
            subscriber.next(this.getFallbackCards(gameId, language));
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

  setCards(cards: Array<LanguagePair | SynonymPair | AntonymPair>, gameId: AppGameId = DEFAULT_GAME, level: GameLevelId = 'easy'): Observable<Array<LanguagePair | SynonymPair | AntonymPair>> {
    const batch = writeBatch(db);
    const cardsCollection = this.getCardsCollection(gameId, level);

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

  deleteCards(gameId: AppGameId = DEFAULT_GAME, level: GameLevelId = 'easy') {
    const cardsCollection = this.getCardsCollection(gameId, level);

    return from(getDocs(cardsCollection)).pipe(
      switchMap((snapshots) => {
        const batch = writeBatch(db);
        snapshots.docs.forEach((snapshot) => batch.delete(snapshot.ref));

        return from(batch.commit()).pipe(
          map(() => snapshots.docs.map((snapshot) => snapshot.data() as LanguagePair | SynonymPair | AntonymPair)),
          map((deletedCards) => {
            this.cardsCache.clear();
            return deletedCards;
          })
        );
      }),
      shareReplay(1)
    );
  }

  getTopScores(gameId: AppGameId, language: string, level: GameLevelId, amount = 5): Observable<ScoreEntry[]> {
    const cacheKey = `${gameId}:${language}:${level}:${amount}`;

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
          this.getLeaderboardCollection(gameId, language, level),
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
                gameId: data.gameId || gameId,
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

    return from(addDoc(this.getLeaderboardCollection(score.gameId, score.language, score.level), {
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

  private mapCardsForGame(gameId: AppGameId, documents: Record<string, unknown>[], language: LanguageCode): Card[] {
    if (gameId === 'synonyms') {
      return this.utilsService.generateSynonymCards(documents as unknown as SynonymPair[]);
    }

    if (gameId === 'antonyms') {
      return this.utilsService.generateSynonymCards(documents as unknown as AntonymPair[]);
    }

    return this.utilsService.generateLanguageCards(documents as unknown as LanguagePair[], language);
  }

  private getCardsCollection(gameId: AppGameId, level: GameLevelId): CollectionReference {
    if (gameId === 'languages') {
      return collection(db, level);
    }

    return collection(db, GAMES_COLLECTION, gameId, 'levels', level, 'cards');
  }

  private getCardsCollectionLabel(gameId: AppGameId, level: GameLevelId): string {
    if (gameId === 'languages') {
      return level;
    }

    return `${GAMES_COLLECTION}/${gameId}/levels/${level}/cards`;
  }

  private getLeaderboardCollection(gameId: AppGameId, language: string, level: GameLevelId): CollectionReference {
    if (gameId === 'languages') {
      return collection(db, LEADERBOARD_COLLECTION, language, 'levels', level, 'times');
    }

    return collection(db, LEADERBOARD_BY_GAME_COLLECTION, gameId, 'languages', language, 'levels', level, 'times');
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
