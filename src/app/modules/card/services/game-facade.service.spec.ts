import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DataService } from '../../../services/data.service';
import { HelperService } from '../../../utils/helper.service';
import { Card } from '../interfaces/card';
import { GameFacade } from './game-facade.service';

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

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    localStorage.clear();
    dataServiceMock.getCards.mockReturnValue(of(createCardDeck()));

    await TestBed.configureTestingModule({
      providers: [
        GameFacade,
        { provide: DataService, useValue: dataServiceMock },
        { provide: HelperService, useValue: helperServiceMock }
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
});
