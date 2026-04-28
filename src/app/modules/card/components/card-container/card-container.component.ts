import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, NgZone, OnDestroy, Output, ViewEncapsulation } from '@angular/core';

import { Card } from '../../interfaces/card';
import { DataService } from '../../../../services/data.service';
import { HelperService } from '../../../../utils/helper.service';

const BASE_LANGUAGE = 'es';
const DEFAULT_CURRENT_LANGUAGE = 'gb';
const DEFAULT_FLIP_EFFECT = true;
const DEFAULT_SOUND = true;
const DEFAULT_TIMER = 60;
const DEFAULT_TWO_COLUMNS = true;
const LANGUAGES = ['gb', 'it', 'pt', 'de'];
const PAIRS_AMOUNT = 5;
const STICKY_HEADER_FROM = 30;
const CARDS_PER_PAIR = LANGUAGES.length + 1;
const LOCAL_STORAGE = {
  CURRENT_LANGUAGE: 'currentLanguage',
  SOUND: 'sound',
  FLIP_EFFECT: 'flipEffect'
};

@Component({
  selector: 'app-card-container',
  standalone: false,
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CardContainerComponent implements OnDestroy {
  @Input() username = '';
  @Output() logoutRequested = new EventEmitter<void>();

  isGameDialogVisible = false;
  gameDialogMessage = '';
  isMenuOpen = false;
  currentLanguage = DEFAULT_CURRENT_LANGUAGE;
  cards: Card[] = [];
  esCards: Card[] = [];
  gbCards: Card[] = [];
  itCards: Card[] = [];
  ptCards: Card[] = [];
  deCards: Card[] = [];
  isMenuShown = true;
  isFlipEffect = DEFAULT_FLIP_EFFECT;
  isHeaderFixed = false;
  isLastCardSelected = false;
  isSelectionBlocked = false;
  isTwoColumns: boolean;
  isLoading = true;
  isUsingFallbackCards = false;
  cardsSourceReason = '';
  languages = LANGUAGES;
  lastSelection: Card | undefined;
  progress = 0;
  timeLeft = DEFAULT_TIMER;
  timerInterval?: ReturnType<typeof setInterval>;
  isSoundOn = DEFAULT_SOUND;

  private allCards: Card[] = [];
  private currentRoundGroups: Card[][] = [];

  constructor(
    private readonly dataService: DataService,
    private readonly helperService: HelperService,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.isTwoColumns = helperService.isSmallScreen || DEFAULT_TWO_COLUMNS;
    this.loadCards();
  }

  loadCards(): void {
    this.readPreferences();
    this.isLoading = true;

    this.dataService.getCards(LANGUAGES).subscribe((cards: Card[]) => {
      this.syncCardsSourceState();
      this.allCards = cards.map((card) => this.cloneCard(card));
      this.startNewGame();
      this.isLoading = false;
    });
  }

  selectLanguage(event: { value?: string } | string): void {
    this.currentLanguage = typeof event === 'string' ? event : event.value || DEFAULT_CURRENT_LANGUAGE;
    localStorage.setItem(LOCAL_STORAGE.CURRENT_LANGUAGE, this.currentLanguage);
    this.closeMenu();
    this.startNewGame();
  }

  toggleSound(): void {
    this.isSoundOn = !this.isSoundOn;
    localStorage.setItem(LOCAL_STORAGE.SOUND, JSON.stringify(this.isSoundOn));
    this.closeMenu();
  }

  toggleFlipEffect(): void {
    this.isFlipEffect = !this.isFlipEffect;
    localStorage.setItem(LOCAL_STORAGE.FLIP_EFFECT, JSON.stringify(this.isFlipEffect));
    this.closeMenu();
  }

  toggleColumns(): void {
    this.isTwoColumns = !this.isTwoColumns;
    this.rebuildBoard();
    this.closeMenu();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isHeaderFixed = window.scrollY > STICKY_HEADER_FROM;
  }

  shuffleArray(array: Card[]): Card[] {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  twoColumnsArray(esCards: Card[], otherCards: Card[]): Card[] {
    return esCards.flatMap((card: Card, index) => [card, otherCards[index]]);
  }

  selectCard(card: Card): void {
    if (card.selected) {
      card.selected = false;
      this.isLastCardSelected = false;
      this.lastSelection = undefined;
      return;
    }

    if ('speechSynthesis' in window && this.isSoundOn) {
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
      return;
    }

    this.checkMatch(card);
  }

  checkMatch(card: Card): void {
    if (this.isSelectionBlocked || !this.lastSelection) {
      return;
    }

    if (this.isFlipEffect) {
      this.isSelectionBlocked = true;
    }

    card.selected = true;
    const isMatch = this.lastSelection.pairs.includes(card.id);

    card.match = isMatch;
    this.lastSelection.match = isMatch;

    if (isMatch) {
      this.progress = this.progress + (2 * 100) / this.cards.length;
      this.resetCurrentSelection(card);
      this.progressBarCompleted();
      return;
    }

    if (this.isFlipEffect) {
      setTimeout(() => this.resetCurrentSelection(card), 500);
      return;
    }

    this.resetCurrentSelection(card);
  }

  progressBarCompleted(): void {
    if (Math.round(this.progress) === 100) {
      this.stopTimer();
      this.openGameDialog(`Completado en ${DEFAULT_TIMER - this.timeLeft} segundos`);
    }
  }

  startTimer(timer: number = DEFAULT_TIMER): void {
    this.stopTimer();
    this.timeLeft = timer;
    this.timerInterval = setInterval(() => {
      this.ngZone.run(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          this.openGameDialog('Se acabó el tiempo');
          this.stopTimer();
        }

        this.cdr.detectChanges();
      });
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  openGameDialog(message: string): void {
    this.closeMenu();
    this.gameDialogMessage = message;
    this.isGameDialogVisible = true;
  }

  closeGameDialog(reload = false): void {
    this.isGameDialogVisible = false;
    this.gameDialogMessage = '';

    if (reload) {
      this.startNewGame();
    }
  }

  private startNewGame(): void {
    this.progress = 0;
    this.lastSelection = undefined;
    this.isLastCardSelected = false;
    this.isSelectionBlocked = false;
    this.stopTimer();
    this.startTimer();
    this.currentRoundGroups = this.getRandomCardGroups();
    this.rebuildBoard();
  }

  private rebuildBoard(): void {
    this.esCards = this.shuffleArray(this.getCardsForLanguage(BASE_LANGUAGE));
    this.gbCards = this.shuffleArray(this.getCardsForLanguage('gb'));
    this.itCards = this.shuffleArray(this.getCardsForLanguage('it'));
    this.ptCards = this.shuffleArray(this.getCardsForLanguage('pt'));
    this.deCards = this.shuffleArray(this.getCardsForLanguage('de'));

    const secondLanguageCards = this.getSelectedLanguageCards();
    this.cards = this.isTwoColumns
      ? this.twoColumnsArray(this.esCards, secondLanguageCards)
      : this.shuffleArray([...this.esCards, ...secondLanguageCards]);
  }

  private getCardsForLanguage(language: string): Card[] {
    const languageIndex = [BASE_LANGUAGE, ...LANGUAGES].indexOf(language);
    return this.currentRoundGroups.map((group) => group[languageIndex]);
  }

  private getSelectedLanguageCards(): Card[] {
    switch (this.currentLanguage) {
      case 'it':
        return this.itCards;
      case 'pt':
        return this.ptCards;
      case 'de':
        return this.deCards;
      case 'gb':
      default:
        return this.gbCards;
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
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  private readPreferences(): void {
    this.currentLanguage = localStorage.getItem(LOCAL_STORAGE.CURRENT_LANGUAGE) || DEFAULT_CURRENT_LANGUAGE;
    this.isFlipEffect = this.getBooleanPreference(LOCAL_STORAGE.FLIP_EFFECT, DEFAULT_FLIP_EFFECT);
    this.isSoundOn = this.getBooleanPreference(LOCAL_STORAGE.SOUND, DEFAULT_SOUND);
  }

  private syncCardsSourceState(): void {
    this.isUsingFallbackCards = this.dataService.getCardsSource() === 'fallback';
    this.cardsSourceReason = this.dataService.getCardsSourceReason();
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
}
