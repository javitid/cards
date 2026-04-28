import { Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { DataService } from '../../../services/data.service';
import { HelperService } from '../../../utils/helper.service';
import { Card } from '../interfaces/card';

const BASE_LANGUAGE = 'es';
const DEFAULT_CURRENT_LANGUAGE = 'gb';
const DEFAULT_FLIP_EFFECT = true;
const DEFAULT_SOUND = true;
const DEFAULT_TIMER = 60;
const DEFAULT_TWO_COLUMNS = true;
const LANGUAGES = ['gb', 'it', 'pt', 'de'];
const PAIRS_AMOUNT = 5;
const CARDS_PER_PAIR = LANGUAGES.length + 1;
const LOCAL_STORAGE = {
  CURRENT_LANGUAGE: 'currentLanguage',
  SOUND: 'sound',
  FLIP_EFFECT: 'flipEffect'
};

@Injectable()
export class GameFacade {
  readonly cards = signal<Card[]>([]);
  readonly isLoading = signal(true);
  readonly currentLanguage = signal(DEFAULT_CURRENT_LANGUAGE);
  readonly progress = signal(0);
  readonly timeLeft = signal(DEFAULT_TIMER);
  readonly isFlipEffect = signal(DEFAULT_FLIP_EFFECT);
  readonly isSoundOn = signal(DEFAULT_SOUND);
  readonly isTwoColumns = signal(DEFAULT_TWO_COLUMNS);
  readonly isUsingFallbackCards = signal(false);
  readonly cardsSourceReason = signal('');
  readonly isGameDialogVisible = signal(false);
  readonly gameDialogMessage = signal('');
  readonly languages = LANGUAGES;

  private allCards: Card[] = [];
  private currentRoundGroups: Card[][] = [];
  private timerInterval?: ReturnType<typeof setInterval>;
  private cardsSubscription?: Subscription;
  private lastSelection: Card | undefined;
  private isLastCardSelected = false;
  private isSelectionBlocked = false;

  constructor(
    private readonly dataService: DataService,
    private readonly helperService: HelperService
  ) {
    this.isTwoColumns.set(this.helperService.isSmallScreen || DEFAULT_TWO_COLUMNS);
  }

  loadCards(): void {
    this.readPreferences();
    this.isLoading.set(true);
    this.cardsSubscription?.unsubscribe();

    this.cardsSubscription = this.dataService.getCards(LANGUAGES).subscribe((cards: Card[]) => {
      this.syncCardsSourceState();
      this.allCards = cards.map((card) => this.cloneCard(card));
      this.startNewGame();
      this.isLoading.set(false);
    });
  }

  dispose(): void {
    this.cardsSubscription?.unsubscribe();
    this.cardsSubscription = undefined;
    this.stopTimer();
  }

  selectLanguage(event: { value?: string } | string): void {
    const nextLanguage = typeof event === 'string' ? event : event.value || DEFAULT_CURRENT_LANGUAGE;
    this.currentLanguage.set(nextLanguage);
    localStorage.setItem(LOCAL_STORAGE.CURRENT_LANGUAGE, nextLanguage);
    this.startNewGame();
  }

  toggleSound(): void {
    const nextValue = !this.isSoundOn();
    this.isSoundOn.set(nextValue);
    localStorage.setItem(LOCAL_STORAGE.SOUND, JSON.stringify(nextValue));
  }

  toggleFlipEffect(): void {
    const nextValue = !this.isFlipEffect();
    this.isFlipEffect.set(nextValue);
    localStorage.setItem(LOCAL_STORAGE.FLIP_EFFECT, JSON.stringify(nextValue));
  }

  toggleColumns(): void {
    this.isTwoColumns.set(!this.isTwoColumns());
    this.rebuildBoard();
  }

  selectCard(card: Card): void {
    if (card.selected) {
      card.selected = false;
      this.isLastCardSelected = false;
      this.lastSelection = undefined;
      this.touchCards();
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
      this.lastSelection = card;
      this.lastSelection.selected = true;
      this.isLastCardSelected = true;
      this.touchCards();
      return;
    }

    this.checkMatch(card);
  }

  closeGameDialog(reload = false): void {
    this.setGameDialogVisible(false);

    if (reload) {
      this.startNewGame();
    }
  }

  setGameDialogVisible(visible: boolean): void {
    this.isGameDialogVisible.set(visible);

    if (!visible) {
      this.gameDialogMessage.set('');
    }
  }

  private checkMatch(card: Card): void {
    if (this.isSelectionBlocked || !this.lastSelection) {
      return;
    }

    if (this.isFlipEffect()) {
      this.isSelectionBlocked = true;
    }

    card.selected = true;
    const isMatch = this.lastSelection.pairs.includes(card.id);

    card.match = isMatch;
    this.lastSelection.match = isMatch;
    this.touchCards();

    if (isMatch) {
      this.progress.set(this.progress() + (2 * 100) / this.cards().length);
      this.resetCurrentSelection(card);
      this.progressBarCompleted();
      return;
    }

    if (this.isFlipEffect()) {
      setTimeout(() => this.resetCurrentSelection(card), 500);
      return;
    }

    this.resetCurrentSelection(card);
  }

  private progressBarCompleted(): void {
    if (Math.round(this.progress()) === 100) {
      this.stopTimer();
      this.openGameDialog(`Completado en ${DEFAULT_TIMER - this.timeLeft()} segundos`);
    }
  }

  private startTimer(timer: number = DEFAULT_TIMER): void {
    this.stopTimer();
    this.timeLeft.set(timer);
    this.timerInterval = setInterval(() => {
      if (this.timeLeft() > 0) {
        this.timeLeft.set(this.timeLeft() - 1);
      } else {
        this.openGameDialog('Se acabó el tiempo');
        this.stopTimer();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  private openGameDialog(message: string): void {
    this.gameDialogMessage.set(message);
    this.isGameDialogVisible.set(true);
  }

  private startNewGame(): void {
    this.progress.set(0);
    this.lastSelection = undefined;
    this.isLastCardSelected = false;
    this.isSelectionBlocked = false;
    this.stopTimer();
    this.startTimer();
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
    const desiredPairs = Math.min(PAIRS_AMOUNT, totalPairs);
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

  private resetCurrentSelection(card: Card): void {
    if (this.lastSelection) {
      this.lastSelection.selected = false;
    }

    card.selected = false;
    this.lastSelection = undefined;
    this.isLastCardSelected = false;
    this.isSelectionBlocked = false;
    this.touchCards();
  }

  private readPreferences(): void {
    this.currentLanguage.set(localStorage.getItem(LOCAL_STORAGE.CURRENT_LANGUAGE) || DEFAULT_CURRENT_LANGUAGE);
    this.isFlipEffect.set(this.getBooleanPreference(LOCAL_STORAGE.FLIP_EFFECT, DEFAULT_FLIP_EFFECT));
    this.isSoundOn.set(this.getBooleanPreference(LOCAL_STORAGE.SOUND, DEFAULT_SOUND));
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

  private touchCards(): void {
    this.cards.set([...this.cards()]);
  }
}
