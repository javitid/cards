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

  const createCardDeck = (pairCount = 10): Card[] =>
    Array.from({ length: pairCount }, (_, pairIndex) => {
      const baseId = pairIndex * 2;

      return [
        { id: baseId, groupId: pairIndex, value: `es-${pairIndex}`, voice: 'es-ES', pairs: [baseId + 1], selected: false, match: false, icon: '' },
        { id: baseId + 1, groupId: pairIndex, value: `gb-${pairIndex}`, voice: 'en-GB', pairs: [baseId], selected: false, match: false, icon: '' }
      ];
    }).flat();
  const createImageDeck = (pairCount = 12, folder = 'memory-pairs'): Card[] =>
    Array.from({ length: pairCount }, (_, pairIndex) => {
      const baseId = pairIndex * 2;
      const imageName = `shape-${pairIndex}`;

      return [
        { id: baseId, groupId: pairIndex, value: imageName, voice: '', pairs: [baseId + 1], selected: false, match: false, icon: '', contentType: 'image' as const, imageName, imagePath: `assets/${folder}/${imageName}.svg` },
        { id: baseId + 1, groupId: pairIndex, value: imageName, voice: '', pairs: [baseId], selected: false, match: false, icon: '', contentType: 'image' as const, imageName, imagePath: `assets/${folder}/${imageName}.svg` }
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
    timerServiceMock.timeLeft.set(60);
    leaderboardServiceMock.canSaveScore.set(false);
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
    const firstCard = facade.cards()[0];
    const secondCard = facade.cards().find((card) => card.id !== firstCard.id && !firstCard.pairs.includes(card.id));

    expect(firstCard).toBeTruthy();
    expect(secondCard).toBeTruthy();

    facade.selectCard(firstCard!);
    facade.selectCard(secondCard!);

    expect(facade.cards().find((card) => card.id === firstCard!.id)?.selected).toBe(true);
    expect(facade.cards().find((card) => card.id === secondCard!.id)?.selected).toBe(true);

    jest.advanceTimersByTime(500);

    expect(facade.cards().find((card) => card.id === firstCard!.id)?.selected).toBe(false);
    expect(facade.cards().find((card) => card.id === secondCard!.id)?.selected).toBe(false);
    expect(facade.cards().find((card) => card.id === firstCard!.id)?.match).toBe(false);
    expect(facade.cards().find((card) => card.id === secondCard!.id)?.match).toBe(false);
  });

  it('stores the completed time when the puzzle is solved', () => {
    facade.selectGame('languages');
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

    expect(leaderboardServiceMock.openCompletedDialog).toHaveBeenCalledWith(23, 'languages', 'gb', 'easy');
    expect(leaderboardServiceMock.saveCompletedGame).toHaveBeenCalled();
  });

  it('reaches 100 progress for medium difficulty when all pairs are matched', () => {
    facade.selectGame('languages');
    facade.selectLevel('medium');

    while (facade.progress() < 100) {
      const unmatchedCard = facade.cards().find((card) => !card.match);
      const matchingCard = facade.cards().find((card) => unmatchedCard?.pairs.includes(card.id));

      expect(unmatchedCard).toBeTruthy();
      expect(matchingCard).toBeTruthy();

      facade.selectCard(unmatchedCard!);
      facade.selectCard(matchingCard!);
    }

    expect(facade.progress()).toBe(100);
    expect(facade.displayProgress()).toBe(100);
    expect(leaderboardServiceMock.openCompletedDialog).toHaveBeenCalledWith(15, 'languages', 'gb', 'medium');
  });

  it('reloads cards when changing the level', () => {
    facade.selectGame('languages');
    facade.selectLevel('medium');

    expect(dataServiceMock.getCards).toHaveBeenLastCalledWith('languages', 'gb', 'medium');
    expect(leaderboardServiceMock.initialize).toHaveBeenLastCalledWith('languages', 'gb', 'medium');
  });

  it('uses longer timers for the math game on medium and hard', () => {
    facade.selectGame('math');
    facade.selectLevel('medium');

    expect(timerServiceMock.start).toHaveBeenLastCalledWith(150, expect.any(Function));

    facade.selectLevel('hard');

    expect(timerServiceMock.start).toHaveBeenLastCalledWith(240, expect.any(Function));
  });

  it('uses a fixed mixed board for the pairs game by difficulty', () => {
    dataServiceMock.getCards.mockReturnValue(of(createImageDeck()));

    facade.selectGame('pairs');

    expect(facade.usesImageCards()).toBe(true);
    expect(facade.supportsColumnToggle()).toBe(false);
    expect(facade.boardColumnCount()).toBe(4);
    expect(facade.boardRowCount()).toBe(3);

    facade.selectLevel('medium');
    expect(facade.boardColumnCount()).toBe(4);
    expect(facade.boardRowCount()).toBe(4);

    facade.selectLevel('hard');
    expect(facade.boardColumnCount()).toBe(6);
    expect(facade.boardRowCount()).toBe(4);
  });

  it('uses the same image-board rules for the families game by difficulty', () => {
    dataServiceMock.getCards.mockReturnValue(of(createImageDeck(12, 'memory-families')));

    facade.selectGame('families');

    expect(facade.usesImageCards()).toBe(true);
    expect(facade.supportsColumnToggle()).toBe(false);
    expect(facade.boardColumnCount()).toBe(4);
    expect(facade.boardRowCount()).toBe(3);

    facade.selectLevel('medium');
    expect(facade.boardColumnCount()).toBe(4);
    expect(facade.boardRowCount()).toBe(4);

    facade.selectLevel('hard');
    expect(facade.boardColumnCount()).toBe(6);
    expect(facade.boardRowCount()).toBe(4);
  });

  it('uses the same image-board rules for the countries game by difficulty', () => {
    dataServiceMock.getCards.mockReturnValue(of(createImageDeck(12, 'memory-countries')));

    facade.selectGame('countries');

    expect(facade.usesImageCards()).toBe(true);
    expect(facade.supportsColumnToggle()).toBe(false);
    expect(facade.boardColumnCount()).toBe(4);
    expect(facade.boardRowCount()).toBe(3);

    facade.selectLevel('medium');
    expect(facade.boardColumnCount()).toBe(4);
    expect(facade.boardRowCount()).toBe(4);

    facade.selectLevel('hard');
    expect(facade.boardColumnCount()).toBe(6);
    expect(facade.boardRowCount()).toBe(4);
  });

  it('plays a short match sound when the selected pair is correct', () => {
    const playMatchSoundSpy = jest.spyOn(facade as never, 'playMatchSound' as never);
    const firstCard = facade.cards()[0];
    const matchingCard = facade.cards().find((card) => firstCard.pairs.includes(card.id));

    expect(firstCard).toBeTruthy();
    expect(matchingCard).toBeTruthy();

    facade.selectCard(firstCard!);
    facade.selectCard(matchingCard!);

    expect(playMatchSoundSpy).toHaveBeenCalledTimes(1);
  });

  it('plays a victory sound when the puzzle is completed', () => {
    const playVictorySoundSpy = jest.spyOn(facade as never, 'playVictorySound' as never);

    while (Math.round(facade.progress()) < 100) {
      const unmatchedCard = facade.cards().find((card) => !card.match);
      const matchingCard = facade.cards().find((card) => unmatchedCard?.pairs.includes(card.id));

      expect(unmatchedCard).toBeTruthy();
      expect(matchingCard).toBeTruthy();

      facade.selectCard(unmatchedCard!);
      facade.selectCard(matchingCard!);
    }

    expect(playVictorySoundSpy).toHaveBeenCalledTimes(1);
  });
});
