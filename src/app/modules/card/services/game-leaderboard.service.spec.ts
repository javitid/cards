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
    username: jest.fn(() => 'Jugador demo'),
    getCurrentUserId: jest.fn(() => 'uid-1'),
    isAnonymousUser: jest.fn(() => false)
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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
        playerName: 'Ana',
        durationSeconds: 18,
        language: 'gb',
        createdAt: 1,
        userId: 'uid-1',
        isAnonymous: false
      }
    ]));

    service.loadLeaderboard('gb');

    expect(dataServiceMock.getTopScores).toHaveBeenCalledWith('gb', 5);
    expect(service.leaderboard()[0]?.playerName).toBe('Ana');
  });

  it('saves a completed score with the logged user by default', () => {
    service.resetRoundState();
    service.openCompletedDialog(21, 'gb');
    service.saveCompletedGame();

    expect(dataServiceMock.saveScore).toHaveBeenCalledWith(
      expect.objectContaining({
        playerName: 'Jugador demo',
        durationSeconds: 21,
        language: 'gb',
        userId: 'uid-1',
        isAnonymous: false
      })
    );
  });

  it('exposes an error message when the score cannot be saved', () => {
    dataServiceMock.saveScore.mockReturnValueOnce(throwError(() => new Error('Firestore caido')));

    service.openCompletedDialog(21, 'gb');
    service.saveCompletedGame();

    expect(service.scoreSaveMessage()).toBe('Firestore caido');
  });
});
