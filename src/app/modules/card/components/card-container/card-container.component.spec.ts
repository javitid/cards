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
      const baseId = pairIndex * 2;

      return [
        { id: baseId, groupId: pairIndex, value: `es-${pairIndex}`, voice: 'es-ES', pairs: [baseId + 1], selected: false, match: false, icon: '' },
        { id: baseId + 1, groupId: pairIndex, value: `gb-${pairIndex}`, voice: 'en-GB', pairs: [baseId], selected: false, match: false, icon: '' }
      ];
    }).flat();
  const gameFacadeMock = {
    cards: signal<Card[]>(createCardDeck()),
    isLoading: signal(false),
    currentGame: signal('languages'),
    currentLanguage: signal('gb'),
    currentLevel: signal('easy'),
    progress: signal(0),
    timeLeft: signal(60),
    isFlipEffect: signal(true),
    isSoundOn: signal(true),
    isTwoColumns: signal(true),
    isUsingFallbackCards: signal(false),
    cardsSourceReason: signal(''),
    isGameDialogVisible: signal(false),
    gameDialogMessage: signal(''),
    leaderboard: signal([]),
    leaderboardMessage: signal(''),
    leaderboardAvailable: signal(true),
    playerName: signal('Invitado'),
    isSavingScore: signal(false),
    hasSavedScore: signal(false),
    scoreSaveMessage: signal(''),
    canSaveScore: signal(false),
    games: [
      { id: 'languages', label: 'Idiomas', description: '', instructions: '', supportsLanguageSelection: true, defaultLanguage: 'gb' },
      { id: 'synonyms', label: 'Sinonimos', description: '', instructions: '', supportsLanguageSelection: false, defaultLanguage: 'es' },
      { id: 'antonyms', label: 'Antonimos', description: '', instructions: '', supportsLanguageSelection: false, defaultLanguage: 'es' }
    ],
    languages: ['gb', 'it', 'pt', 'de'],
    levels: [
      { id: 'easy', label: 'Facil', pairs: 5, timerSeconds: 60 },
      { id: 'medium', label: 'Medio', pairs: 7, timerSeconds: 75 },
      { id: 'hard', label: 'Dificil', pairs: 9, timerSeconds: 90 }
    ],
    loadCards: jest.fn(),
    dispose: jest.fn(),
    selectGame: jest.fn(),
    selectLanguage: jest.fn(),
    selectLevel: jest.fn(),
    toggleSound: jest.fn(),
    toggleFlipEffect: jest.fn(),
    toggleColumns: jest.fn(),
    selectCard: jest.fn(),
    closeGameDialog: jest.fn(),
    saveCompletedGame: jest.fn(),
    setPlayerName: jest.fn(),
    currentGameLabel: jest.fn(() => 'Idiomas'),
    currentGameDescription: jest.fn(() => 'Empareja una palabra con su traduccion.'),
    currentGameInstructions: jest.fn(() => 'Empareja cada palabra con su traduccion.'),
    supportsLanguageSelection: jest.fn(() => true),
    currentLevelLabel: jest.fn(() => 'Facil'),
    displayProgress: jest.fn(() => 0),
    boardColumnCount: jest.fn(() => 2),
    boardRowCount: jest.fn(() => 5)
  };

  beforeEach(async () => {
    gameFacadeMock.loadCards.mockClear();
    gameFacadeMock.dispose.mockClear();
    gameFacadeMock.selectGame.mockClear();
    gameFacadeMock.selectLanguage.mockClear();
    gameFacadeMock.selectLevel.mockClear();
    gameFacadeMock.toggleSound.mockClear();
    gameFacadeMock.toggleFlipEffect.mockClear();
    gameFacadeMock.toggleColumns.mockClear();
    gameFacadeMock.selectCard.mockClear();
    gameFacadeMock.closeGameDialog.mockClear();
    gameFacadeMock.saveCompletedGame.mockClear();
    gameFacadeMock.setPlayerName.mockClear();

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

  it('should switch level without fetching twice from the component', () => {
    component.selectLevel('medium');

    expect(gameFacadeMock.selectLevel).toHaveBeenCalledWith('medium');
    expect(gameFacadeMock.loadCards).toHaveBeenCalledTimes(1);
  });

  it('should switch game without fetching twice from the component', () => {
    component.selectGame('synonyms');

    expect(gameFacadeMock.selectGame).toHaveBeenCalledWith('synonyms');
    expect(gameFacadeMock.loadCards).toHaveBeenCalledTimes(1);
  });
});
