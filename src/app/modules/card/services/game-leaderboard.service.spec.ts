import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../services/auth.service';
import { DataService } from '../../../services/data.service';
import { GameLeaderboardService } from './game-leaderboard.service';

describe('GameLeaderboardService', () => {
  let service: GameLeaderboardService;

  const dataServiceMock = {
    getTopScores: jest.fn(),
    saveScore: jest.fn()
  };

  const authServiceMock = {
    username: jest.fn(() => 'jugador.demo@correo.com'),
    getCurrentUserId: jest.fn(() => 'uid-1'),
    isAnonymousUser: jest.fn(() => false)
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1024 });
    dataServiceMock.getTopScores.mockReturnValue(of([]));
    dataServiceMock.saveScore.mockReturnValue(of(undefined));

    await TestBed.configureTestingModule({
      providers: [
        GameLeaderboardService,
        { provide: DataService, useValue: dataServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    service = TestBed.inject(GameLeaderboardService);
  });

  afterEach(() => {
    service.dispose();
  });

  it('loads leaderboard entries for the selected language', () => {
    dataServiceMock.getTopScores.mockReturnValueOnce(of([
      {
        id: '1',
        gameId: 'languages',
        playerName: 'Ana',
        durationSeconds: 18,
        language: 'gb',
        level: 'medium',
        createdAt: 1,
        userId: 'uid-1',
        isAnonymous: false
      }
    ]));

    service.loadLeaderboard('languages', 'gb', 'medium');

    expect(dataServiceMock.getTopScores).toHaveBeenCalledWith('languages', 'gb', 'medium', 10);
    expect(service.leaderboard()[0]?.playerName).toBe('Ana');
  });

  it('saves a completed score with the logged user by default', () => {
    service.resetRoundState();
    service.openCompletedDialog(21, 'languages', 'gb', 'medium');
    service.saveCompletedGame();

    expect(dataServiceMock.saveScore).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: 'languages',
        playerName: 'jugador.demo',
        durationSeconds: 21,
        language: 'gb',
        level: 'medium',
        userId: 'uid-1',
        isAnonymous: false
      })
    );
  });

  it('uses Invitado as default name for anonymous users', () => {
    authServiceMock.isAnonymousUser.mockReturnValue(true);
    authServiceMock.username.mockReturnValue('Invitado');

    service.resetRoundState();
    service.openCompletedDialog(18, 'languages', 'gb', 'easy');
    service.saveCompletedGame();

    expect(dataServiceMock.saveScore).toHaveBeenCalledWith(
      expect.objectContaining({
        playerName: 'Invitado',
        isAnonymous: true
      })
    );

    authServiceMock.isAnonymousUser.mockReturnValue(false);
    authServiceMock.username.mockReturnValue('jugador.demo@correo.com');
  });

  it('auto-saves on mobile without opening the dialog', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 390 });

    service.openCompletedDialog(16, 'languages', 'gb', 'easy');

    expect(service.isGameDialogVisible()).toBe(true);
    expect(service.showCompletedLeaderboard()).toBe(true);
    expect(dataServiceMock.saveScore).toHaveBeenCalledWith(
      expect.objectContaining({
        playerName: 'jugador.demo',
        durationSeconds: 16
      })
    );
  });

  it('exposes an error message when the score cannot be saved', () => {
    dataServiceMock.saveScore.mockReturnValueOnce(throwError(() => new Error('Firestore caido')));

    service.openCompletedDialog(21, 'languages', 'gb', 'hard');
    service.saveCompletedGame();

    expect(service.scoreSaveMessage()).toBe('Firestore caido');
  });
});
