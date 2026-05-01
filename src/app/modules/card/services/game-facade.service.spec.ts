import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { DataService } from '../../../services/data.service';
import { HelperService } from '../../../utils/helper.service';
import { Card } from '../interfaces/card';
import { GameFacade } from './game-facade.service';
import { GameLeaderboardService } from './game-leaderboard.service';
import { GameTimerService } from './game-timer.service';

describe('GameFacade', () => {
  let facade: GameFacade;

  const createCardDeck = (): Card[] =>
    Array.from({ length: 2 }, (_, pairIndex) => {
      const baseId = pairIndex * 5;

      return [
        { id: baseId, value: `es-${pairIndex}`, voice: 'es-ES', pairs: [baseId + 1, baseId + 2, baseId + 3, baseId + 4], selected: false, match: false, icon: '' },
        { id: baseId + 1, value: `gb-${pairIndex}`, voice: 'en-GB', pairs: [baseId, baseId + 2, baseId + 3, baseId + 4], selected: false, match: false, icon: '' },
        { id: baseId + 2, value: `it-${pairIndex}`, voice: 'it-IT', pairs: [baseId, baseId + 1, baseId + 3, baseId + 4], selected: false, match: false, icon: '' },
        { id: baseId + 3, value: `pt-${pairIndex}`, voice: 'pt-PT', pairs: [baseId, baseId + 1, baseId + 2, baseId + 4], selected: false, match: false, icon: '' },
        { id: baseId + 4, value: `de-${pairIndex}`, voice: 'de-DE', pairs: [baseId, baseId + 1, baseId + 2, baseId + 3], selected: false, match: false, icon: '' }
      ];
    }).flat();

  const dataServiceMock = {
    getCards: jest.fn(),
    getCardsSource: jest.fn(() => 'firestore'),
    getCardsSourceReason: jest.fn(() => 'Conectado a Firestore.')
  };

  const helperServiceMock = {
    isSmallScreen: false
  };

  const timerServiceMock = {
    timeLeft: signal(60),
    start: jest.fn((_seconds: number, _onFinished: () => void) => undefined),
    stop: jest.fn()
  };

  const leaderboardServiceMock = {
    isGameDialogVisible: signal(false),
    gameDialogMessage: signal(''),
    leaderboard: signal([]),
    leaderboardMessage: signal(''),
    leaderboardAvailable: signal(true),
    playerName: signal('Jugador demo'),
    isSavingScore: signal(false),
    hasSavedScore: signal(false),
    scoreSaveMessage: signal(''),
    canSaveScore: signal(false),
    initialize: jest.fn(),
    dispose: jest.fn(),
    loadLeaderboard: jest.fn(),
    resetRoundState: jest.fn(),
    openCompletedDialog: jest.fn(),
    openTimeoutDialog: jest.fn(),
    setGameDialogVisible: jest.fn(),
    setPlayerName: jest.fn(),
    saveCompletedGame: jest.fn()
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    localStorage.clear();
    dataServiceMock.getCards.mockReturnValue(of(createCardDeck()));

    await TestBed.configureTestingModule({
      providers: [
        GameFacade,
        { provide: DataService, useValue: dataServiceMock },
        { provide: HelperService, useValue: helperServiceMock },
        { provide: GameTimerService, useValue: timerServiceMock },
        { provide: GameLeaderboardService, useValue: leaderboardServiceMock }
      ]
    }).compileComponents();

    facade = TestBed.inject(GameFacade);
    facade.loadCards();
  });

  afterEach(() => {
    facade.dispose();
    jest.useRealTimers();
  });

  it('hides two unmatched cards again after the flip timeout', () => {
    const firstCard = facade.cards().find((card) => card.id === 0);
    const secondCard = facade.cards().find((card) => card.id === 5);

    expect(firstCard).toBeTruthy();
    expect(secondCard).toBeTruthy();

    facade.selectCard(firstCard!);
    facade.selectCard(secondCard!);

    expect(facade.cards().find((card) => card.id === 0)?.selected).toBe(true);
    expect(facade.cards().find((card) => card.id === 5)?.selected).toBe(true);

    jest.advanceTimersByTime(500);

    expect(facade.cards().find((card) => card.id === 0)?.selected).toBe(false);
    expect(facade.cards().find((card) => card.id === 5)?.selected).toBe(false);
    expect(facade.cards().find((card) => card.id === 0)?.match).toBe(false);
    expect(facade.cards().find((card) => card.id === 5)?.match).toBe(false);
  });

  it('stores the completed time when the puzzle is solved', () => {
    timerServiceMock.timeLeft.set(37);
    leaderboardServiceMock.canSaveScore.set(true);

    while (Math.round(facade.progress()) < 100) {
      const unmatchedCard = facade.cards().find((card) => !card.match);
      const matchingCard = facade.cards().find((card) => unmatchedCard?.pairs.includes(card.id));

      expect(unmatchedCard).toBeTruthy();
      expect(matchingCard).toBeTruthy();

      facade.selectCard(unmatchedCard!);
      facade.selectCard(matchingCard!);
    }

    facade.saveCompletedGame();

    expect(leaderboardServiceMock.openCompletedDialog).toHaveBeenCalledWith(23, 'gb');
    expect(leaderboardServiceMock.saveCompletedGame).toHaveBeenCalled();
  });
});
