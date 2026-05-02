import { Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../services/auth.service';
import { DataService } from '../../../services/data.service';
import { AppGameId, GameLevelId, ScoreEntry } from '../interfaces/card';

const LEADERBOARD_LIMIT = 5;

@Injectable()
export class GameLeaderboardService {
  readonly isGameDialogVisible = signal(false);
  readonly gameDialogMessage = signal('');
  readonly leaderboard = signal<ScoreEntry[]>([]);
  readonly leaderboardMessage = signal('Cargando mejores tiempos...');
  readonly leaderboardAvailable = signal(true);
  readonly playerName = signal('Invitado');
  readonly isSavingScore = signal(false);
  readonly hasSavedScore = signal(false);
  readonly scoreSaveMessage = signal('');
  readonly canSaveScore = signal(false);

  private leaderboardSubscription?: Subscription;
  private completedTimeSeconds?: number;
  private currentGame: AppGameId = 'languages';
  private currentLanguage = 'gb';
  private currentLevel: GameLevelId = 'easy';

  constructor(
    private readonly dataService: DataService,
    private readonly authService: AuthService
  ) {}

  initialize(gameId: AppGameId, language: string, level: GameLevelId): void {
    this.playerName.set(this.getDefaultPlayerName());
    this.loadLeaderboard(gameId, language, level);
  }

  dispose(): void {
    this.leaderboardSubscription?.unsubscribe();
    this.leaderboardSubscription = undefined;
  }

  loadLeaderboard(gameId: AppGameId, language: string, level: GameLevelId): void {
    this.currentGame = gameId;
    this.currentLanguage = language;
    this.currentLevel = level;
    this.leaderboardMessage.set('Cargando mejores tiempos...');
    this.leaderboardAvailable.set(true);
    this.leaderboardSubscription?.unsubscribe();

    this.leaderboardSubscription = this.dataService.getTopScores(gameId, language, level, LEADERBOARD_LIMIT).subscribe({
      next: (scores) => {
        this.leaderboard.set(scores);
        this.leaderboardMessage.set(scores.length ? '' : 'Todavía no hay tiempos guardados.');
      },
      error: () => {
        this.leaderboard.set([]);
        this.leaderboardAvailable.set(false);
        this.leaderboardMessage.set('No se pudo cargar el ranking.');
      }
    });
  }

  resetRoundState(): void {
    this.completedTimeSeconds = undefined;
    this.canSaveScore.set(false);
    this.isSavingScore.set(false);
    this.hasSavedScore.set(false);
    this.scoreSaveMessage.set('');
    this.playerName.set(this.getDefaultPlayerName());
  }

  openCompletedDialog(durationSeconds: number, gameId: AppGameId, language: string, level: GameLevelId): void {
    this.currentGame = gameId;
    this.currentLanguage = language;
    this.currentLevel = level;
    this.completedTimeSeconds = durationSeconds;
    this.canSaveScore.set(true);
    this.gameDialogMessage.set(`Completado en ${durationSeconds} segundos`);
    this.isGameDialogVisible.set(true);
  }

  openTimeoutDialog(): void {
    this.completedTimeSeconds = undefined;
    this.canSaveScore.set(false);
    this.gameDialogMessage.set('Se acabó el tiempo');
    this.isGameDialogVisible.set(true);
  }

  setGameDialogVisible(visible: boolean): void {
    this.isGameDialogVisible.set(visible);

    if (!visible) {
      this.gameDialogMessage.set('');
    }
  }

  setPlayerName(name: string): void {
    this.playerName.set(name);
  }

  saveCompletedGame(): void {
    const playerName = this.playerName().trim() || this.getDefaultPlayerName();

    if (
      !this.canSaveScore()
      || this.isSavingScore()
      || this.hasSavedScore()
      || this.completedTimeSeconds === undefined
    ) {
      return;
    }

    this.playerName.set(playerName);
    this.isSavingScore.set(true);
    this.scoreSaveMessage.set('');

    this.dataService.saveScore({
      gameId: this.currentGame,
      playerName,
      durationSeconds: this.completedTimeSeconds,
      language: this.currentLanguage,
      level: this.currentLevel,
      userId: this.authService.getCurrentUserId(),
      isAnonymous: this.authService.isAnonymousUser()
    }).subscribe({
      next: () => {
        this.isSavingScore.set(false);
        this.hasSavedScore.set(true);
        this.scoreSaveMessage.set('Tiempo guardado en el ranking.');
      },
      error: (error: Error) => {
        this.isSavingScore.set(false);
        this.scoreSaveMessage.set(error.message || 'No se pudo guardar el tiempo.');
      }
    });
  }

  private getDefaultPlayerName(): string {
    return this.authService.username().trim() || 'Invitado';
  }
}
