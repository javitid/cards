import { Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { DataService } from '../../../services/data.service';
import { HelperService } from '../../../utils/helper.service';
import { Card, GameLevelId } from '../interfaces/card';
import { DEFAULT_CURRENT_LANGUAGE, DEFAULT_FLIP_EFFECT, DEFAULT_LEVEL, DEFAULT_SOUND, DEFAULT_TWO_COLUMNS, GAME_LEVELS, LANGUAGES, LOCAL_STORAGE_KEYS } from './game-config';
import { GameLeaderboardService } from './game-leaderboard.service';
import { GameTimerService } from './game-timer.service';

const BASE_LANGUAGE = 'es';
const CARDS_PER_PAIR = LANGUAGES.length + 1;

@Injectable()
export class GameFacade {
  readonly cards = signal<Card[]>([]);
  readonly isLoading = signal(true);
  readonly currentLanguage = signal(DEFAULT_CURRENT_LANGUAGE);
  readonly currentLevel = signal<GameLevelId>(DEFAULT_LEVEL);
  readonly progress = signal(0);
  readonly isFlipEffect = signal(DEFAULT_FLIP_EFFECT);
  readonly isSoundOn = signal(DEFAULT_SOUND);
  readonly isTwoColumns = signal(DEFAULT_TWO_COLUMNS);
  readonly isUsingFallbackCards = signal(false);
  readonly cardsSourceReason = signal('');
  readonly languages = LANGUAGES;
  readonly levels = GAME_LEVELS;
  readonly timeLeft = this.timerService.timeLeft;
  readonly isGameDialogVisible = this.leaderboardService.isGameDialogVisible;
  readonly gameDialogMessage = this.leaderboardService.gameDialogMessage;
  readonly leaderboard = this.leaderboardService.leaderboard;
  readonly leaderboardMessage = this.leaderboardService.leaderboardMessage;
  readonly leaderboardAvailable = this.leaderboardService.leaderboardAvailable;
  readonly playerName = this.leaderboardService.playerName;
  readonly isSavingScore = this.leaderboardService.isSavingScore;
  readonly hasSavedScore = this.leaderboardService.hasSavedScore;
  readonly scoreSaveMessage = this.leaderboardService.scoreSaveMessage;
  readonly canSaveScore = this.leaderboardService.canSaveScore;

  private allCards: Card[] = [];
  private currentRoundGroups: Card[][] = [];
  private cardsSubscription?: Subscription;
  private lastSelectionId: number | undefined;
  private isLastCardSelected = false;
  private isSelectionBlocked = false;

  constructor(
    private readonly dataService: DataService,
    private readonly helperService: HelperService,
    private readonly timerService: GameTimerService,
    private readonly leaderboardService: GameLeaderboardService
  ) {
    this.isTwoColumns.set(this.helperService.isSmallScreen || DEFAULT_TWO_COLUMNS);
  }

  loadCards(): void {
    this.readPreferences();
    this.leaderboardService.initialize(this.currentLanguage(), this.currentLevel());
    this.isLoading.set(true);
    this.cardsSubscription?.unsubscribe();

    this.cardsSubscription = this.dataService.getCards(LANGUAGES, this.currentLevel()).subscribe((cards: Card[]) => {
      this.syncCardsSourceState();
      this.allCards = cards.map((card) => this.cloneCard(card));
      this.startNewGame();
      this.isLoading.set(false);
    });
  }

  dispose(): void {
    this.cardsSubscription?.unsubscribe();
    this.cardsSubscription = undefined;
    this.leaderboardService.dispose();
    this.timerService.stop();
  }

  selectLanguage(event: { value?: string } | string): void {
    const nextLanguage = typeof event === 'string' ? event : event.value || DEFAULT_CURRENT_LANGUAGE;
    this.currentLanguage.set(nextLanguage);
    localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_LANGUAGE, nextLanguage);
    this.leaderboardService.loadLeaderboard(nextLanguage, this.currentLevel());
    this.startNewGame();
  }

  selectLevel(event: { value?: GameLevelId } | GameLevelId): void {
    const nextLevel = typeof event === 'string' ? event : event.value || DEFAULT_LEVEL;

    if (nextLevel === this.currentLevel()) {
      return;
    }

    this.currentLevel.set(nextLevel);
    localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_LEVEL, nextLevel);
    this.loadCards();
  }

  toggleSound(): void {
    const nextValue = !this.isSoundOn();
    this.isSoundOn.set(nextValue);
    localStorage.setItem(LOCAL_STORAGE_KEYS.SOUND, JSON.stringify(nextValue));
  }

  toggleFlipEffect(): void {
    const nextValue = !this.isFlipEffect();
    this.isFlipEffect.set(nextValue);
    localStorage.setItem(LOCAL_STORAGE_KEYS.FLIP_EFFECT, JSON.stringify(nextValue));
  }

  toggleColumns(): void {
    this.isTwoColumns.set(!this.isTwoColumns());
    this.rebuildBoard();
  }

  selectCard(card: Card): void {
    if (card.selected) {
      this.patchCards([card.id], { selected: false });
      this.isLastCardSelected = false;
      this.lastSelectionId = undefined;
      return;
    }

    if ('speechSynthesis' in window && this.isSoundOn()) {
      const synth = window.speechSynthesis;
      const utterThis = new SpeechSynthesisUtterance();
      utterThis.lang = card.voice;
      utterThis.pitch = 1;
      utterThis.rate = 0.8;

      synth.cancel();
      utterThis.text = card.value;
      synth.speak(utterThis);
    }

    if (!this.isLastCardSelected) {
      this.lastSelectionId = card.id;
      this.patchCards([card.id], { selected: true });
      this.isLastCardSelected = true;
      return;
    }

    this.checkMatch(card);
  }

  closeGameDialog(reload = false): void {
    this.setGameDialogVisible(false);
    this.leaderboardService.resetRoundState();

    if (reload) {
      this.startNewGame();
    }
  }

  setGameDialogVisible(visible: boolean): void {
    this.leaderboardService.setGameDialogVisible(visible);
  }

  setPlayerName(name: string): void {
    this.leaderboardService.setPlayerName(name);
  }

  saveCompletedGame(): void {
    this.leaderboardService.saveCompletedGame();
  }

  startNewGameFromUi(): void {
    this.startNewGame();
  }

  boardColumnCount(): number {
    if (this.helperService.isSmallScreen) {
      return 2;
    }

    return this.isTwoColumns() ? 2 : Math.min(5, Math.max(this.cards().length / 2, 1));
  }

  boardRowCount(): number {
    const columns = this.boardColumnCount();
    return Math.max(1, Math.ceil(this.cards().length / columns));
  }

  displayProgress(): number {
    return Math.round(this.progress());
  }

  currentLevelLabel(): string {
    return this.getCurrentLevelConfig().label;
  }

  private checkMatch(card: Card): void {
    if (this.isSelectionBlocked || this.lastSelectionId === undefined) {
      return;
    }

    if (this.isFlipEffect()) {
      this.isSelectionBlocked = true;
    }

    const firstSelectionId = this.lastSelectionId;
    const isMatch = card.pairs.includes(firstSelectionId);

    this.patchCards([firstSelectionId, card.id], {
      selected: true,
      match: isMatch
    });

    if (isMatch) {
      this.updateProgress();
      this.resetCurrentSelection([firstSelectionId, card.id]);
      this.progressBarCompleted();
      return;
    }

    if (this.isFlipEffect()) {
      setTimeout(() => this.resetCurrentSelection([firstSelectionId, card.id]), 500);
      return;
    }

    this.resetCurrentSelection([firstSelectionId, card.id]);
  }

  private progressBarCompleted(): void {
    if (this.cards().length > 0 && this.getMatchedCardsCount() === this.cards().length) {
      this.progress.set(100);
      const timerSeconds = this.getCurrentLevelConfig().timerSeconds;
      const normalizedCompletionTime = timerSeconds - this.timeLeft();
      this.timerService.stop();
      this.leaderboardService.openCompletedDialog(normalizedCompletionTime, this.currentLanguage(), this.currentLevel());
    }
  }

  private startNewGame(): void {
    this.progress.set(0);
    this.lastSelectionId = undefined;
    this.isLastCardSelected = false;
    this.isSelectionBlocked = false;
    this.leaderboardService.resetRoundState();
    this.timerService.start(this.getCurrentLevelConfig().timerSeconds, () => this.leaderboardService.openTimeoutDialog());
    this.currentRoundGroups = this.getRandomCardGroups();
    this.rebuildBoard();
  }

  private rebuildBoard(): void {
    const esCards = this.shuffleArray(this.getCardsForLanguage(BASE_LANGUAGE));
    const secondLanguageCards = this.getSelectedLanguageCards();
    const boardCards = this.isTwoColumns()
      ? this.twoColumnsArray(esCards, secondLanguageCards)
      : this.shuffleArray([...esCards, ...secondLanguageCards]);

    this.cards.set(boardCards);
  }

  private getCardsForLanguage(language: string): Card[] {
    const languageIndex = [BASE_LANGUAGE, ...LANGUAGES].indexOf(language);
    return this.currentRoundGroups.map((group) => group[languageIndex]);
  }

  private getSelectedLanguageCards(): Card[] {
    switch (this.currentLanguage()) {
      case 'it':
        return this.shuffleArray(this.getCardsForLanguage('it'));
      case 'pt':
        return this.shuffleArray(this.getCardsForLanguage('pt'));
      case 'de':
        return this.shuffleArray(this.getCardsForLanguage('de'));
      case 'gb':
      default:
        return this.shuffleArray(this.getCardsForLanguage('gb'));
    }
  }

  private getRandomCardGroups(): Card[][] {
    if (!this.allCards.length) {
      return [];
    }

    const groups: Card[][] = [];
    const totalPairs = Math.floor(this.allCards.length / CARDS_PER_PAIR);
    const desiredPairs = Math.min(this.getCurrentLevelConfig().pairs, totalPairs);
    const selectedIndexes = new Set<number>();

    while (selectedIndexes.size < desiredPairs) {
      selectedIndexes.add(Math.floor(Math.random() * totalPairs));
    }

    selectedIndexes.forEach((pairIndex) => {
      const start = pairIndex * CARDS_PER_PAIR;
      const group = this.allCards
        .slice(start, start + CARDS_PER_PAIR)
        .map((card) => this.cloneCard(card));

      groups.push(group);
    });

    return groups;
  }

  private resetCurrentSelection(cardIds: number[]): void {
    this.patchCards(cardIds, { selected: false });
    this.lastSelectionId = undefined;
    this.isLastCardSelected = false;
    this.isSelectionBlocked = false;
  }

  private readPreferences(): void {
    this.currentLanguage.set(localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_LANGUAGE) || DEFAULT_CURRENT_LANGUAGE);
    this.currentLevel.set(this.getSavedLevel());
    this.isFlipEffect.set(this.getBooleanPreference(LOCAL_STORAGE_KEYS.FLIP_EFFECT, DEFAULT_FLIP_EFFECT));
    this.isSoundOn.set(this.getBooleanPreference(LOCAL_STORAGE_KEYS.SOUND, DEFAULT_SOUND));
  }

  private syncCardsSourceState(): void {
    this.isUsingFallbackCards.set(this.dataService.getCardsSource() === 'fallback');
    this.cardsSourceReason.set(this.dataService.getCardsSourceReason());
  }

  private getBooleanPreference(key: string, defaultValue: boolean): boolean {
    const value = localStorage.getItem(key);

    if (value === null) {
      return defaultValue;
    }

    return value === 'true';
  }

  private getSavedLevel(): GameLevelId {
    const rawLevel = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_LEVEL);
    return GAME_LEVELS.some((level) => level.id === rawLevel) ? (rawLevel as GameLevelId) : DEFAULT_LEVEL;
  }

  private getCurrentLevelConfig() {
    return GAME_LEVELS.find((level) => level.id === this.currentLevel()) || GAME_LEVELS[0];
  }

  private cloneCard(card: Card): Card {
    return {
      ...card,
      pairs: [...card.pairs],
      match: false,
      selected: false
    };
  }

  private shuffleArray(array: Card[]): Card[] {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  private twoColumnsArray(esCards: Card[], otherCards: Card[]): Card[] {
    return esCards.flatMap((card: Card, index) => [card, otherCards[index]]);
  }

  private patchCards(cardIds: number[], patch: Partial<Card>): void {
    const ids = new Set(cardIds);

    this.cards.set(
      this.cards().map((currentCard) =>
        ids.has(currentCard.id)
          ? {
              ...currentCard,
              ...patch,
              pairs: [...currentCard.pairs]
            }
          : currentCard
      )
    );
  }

  private updateProgress(): void {
    const totalCards = this.cards().length;

    if (totalCards === 0) {
      this.progress.set(0);
      return;
    }

    this.progress.set((this.getMatchedCardsCount() / totalCards) * 100);
  }

  private getMatchedCardsCount(): number {
    return this.cards().filter((card) => card.match).length;
  }
}
