import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { CardContainerComponent } from './card-container.component';
import { GameFacade } from '../../services/game-facade.service';
import { Card } from '../../interfaces/card';

describe('CardContainerComponent', () => {
  let component: CardContainerComponent;
  let fixture: ComponentFixture<CardContainerComponent>;
  const createCardDeck = (): Card[] =>
    Array.from({ length: 5 }, (_, pairIndex) => {
      const baseId = pairIndex * 5;

      return [
        { id: baseId, value: `es-${pairIndex}`, voice: 'es-ES', pairs: [baseId + 1, baseId + 2, baseId + 3, baseId + 4], selected: false, match: false, icon: '' },
        { id: baseId + 1, value: `gb-${pairIndex}`, voice: 'en-GB', pairs: [baseId, baseId + 2, baseId + 3, baseId + 4], selected: false, match: false, icon: '' },
        { id: baseId + 2, value: `it-${pairIndex}`, voice: 'it-IT', pairs: [baseId, baseId + 1, baseId + 3, baseId + 4], selected: false, match: false, icon: '' },
        { id: baseId + 3, value: `pt-${pairIndex}`, voice: 'pt-PT', pairs: [baseId, baseId + 1, baseId + 2, baseId + 4], selected: false, match: false, icon: '' },
        { id: baseId + 4, value: `de-${pairIndex}`, voice: 'de-DE', pairs: [baseId, baseId + 1, baseId + 2, baseId + 3], selected: false, match: false, icon: '' }
      ];
    }).flat();
  const gameFacadeMock = {
    cards: signal<Card[]>(createCardDeck()),
    isLoading: signal(false),
    currentLanguage: signal('gb'),
    progress: signal(0),
    timeLeft: signal(60),
    isFlipEffect: signal(true),
    isSoundOn: signal(true),
    isTwoColumns: signal(true),
    isUsingFallbackCards: signal(false),
    cardsSourceReason: signal(''),
    isGameDialogVisible: signal(false),
    gameDialogMessage: signal(''),
    languages: ['gb', 'it', 'pt', 'de'],
    loadCards: jest.fn(),
    dispose: jest.fn(),
    selectLanguage: jest.fn(),
    toggleSound: jest.fn(),
    toggleFlipEffect: jest.fn(),
    toggleColumns: jest.fn(),
    selectCard: jest.fn(),
    closeGameDialog: jest.fn()
  };

  beforeEach(async () => {
    gameFacadeMock.loadCards.mockClear();
    gameFacadeMock.dispose.mockClear();
    gameFacadeMock.selectLanguage.mockClear();
    gameFacadeMock.toggleSound.mockClear();
    gameFacadeMock.toggleFlipEffect.mockClear();
    gameFacadeMock.toggleColumns.mockClear();
    gameFacadeMock.selectCard.mockClear();
    gameFacadeMock.closeGameDialog.mockClear();

    await TestBed.configureTestingModule({
      declarations: [CardContainerComponent],
      providers: [
        { provide: GameFacade, useValue: gameFacadeMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideComponent(CardContainerComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(CardContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch cards once on load', () => {
    expect(gameFacadeMock.loadCards).toHaveBeenCalledTimes(1);
  });

  it('should switch language without fetching again', () => {
    component.selectLanguage('it');

    expect(gameFacadeMock.selectLanguage).toHaveBeenCalledWith('it');
    expect(gameFacadeMock.loadCards).toHaveBeenCalledTimes(1);
  });
});
