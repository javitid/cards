import { Component, HostListener, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { BottomSheetComponent } from './bottom-sheet/bottom-sheet.component';
import { Card } from '../../interfaces/card';
import { DataService } from '../../../../services/data.service';
import { HelperService } from '../../../../utils/helper.service';

const DEFAULT_CURRENT_LANGUAGE = 'us';
const DEFAULT_FLIP_EFFECT = true;
const DEFAULT_SOUND = true;
const DEFAULT_TIMER = 60;
const DESKTOP_VIEW_TWO_COLUMNS = true;
const LANGUAGES = ['us', 'it'];
const PAIRS_AMOUNT = 5;
const STICKY_HEADER_FROM = 30;
const LOCAL_STORAGE = {
  CURRENT_LANGUAGE: 'currentLanguage',
  SOUND: 'sound',
  FLIP_EFFECT: 'flipEffect'
}

@Component({
  selector: 'app-card-container',
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CardContainerComponent implements OnDestroy {
  currentLanguage!: string;
  cards: Card[] = [];
  esCards: Card[] = [];
  enCards: Card[] = [];
  itCards: Card[] = [];
  isFlipEffect !: boolean;
  isHeaderFixed = false;
  isLastCardSelected = false;
  isSelectionBlocked = false; // To avoid a new card selection before timeout expires
  isTwoColumns: boolean;
  languages = LANGUAGES;
  lastSelection: Card|undefined;
  progress = 0;

  // TIMER
  timeLeft = DEFAULT_TIMER;
  timerInterval: any;

  // TEXT TO SPEECH
  isSoundOn!: boolean;
  private synth = window.speechSynthesis;
  private utterThis = new SpeechSynthesisUtterance();

  constructor(
    private readonly bottomSheet: MatBottomSheet,
    private readonly dataService: DataService,
    private readonly helperService: HelperService
  ) {
    this.isTwoColumns = helperService.isSmallScreen || DESKTOP_VIEW_TWO_COLUMNS;
    this.loadCards();
  }

  loadCards() {
    // Local storage
    this.currentLanguage = localStorage.getItem(LOCAL_STORAGE.CURRENT_LANGUAGE) || DEFAULT_CURRENT_LANGUAGE;
    this.isFlipEffect = localStorage.getItem(LOCAL_STORAGE.FLIP_EFFECT) === 'true' ? true: localStorage.getItem(LOCAL_STORAGE.FLIP_EFFECT) === 'false' ? false: DEFAULT_FLIP_EFFECT;
    this.isSoundOn = localStorage.getItem(LOCAL_STORAGE.SOUND) === 'true' ? true: localStorage.getItem(LOCAL_STORAGE.SOUND) === 'false' ? false: DEFAULT_SOUND;

    this.progress = 0;
    this.stopTimer();
    this.startTimer();
    this.dataService.getCards().subscribe( (cards: Card[]) => {
      // Get PAIRS_AMOUNT random numbers to show only these elements instead the full array.
      let randomNumbers: number[] = [];
      this.cards = [];
      for(let i = 0; i < PAIRS_AMOUNT; i++) {
        // Only numbers with index%3 === 0
        let randomNumber = Math.floor(Math.random() * cards.length/3) * 3;

        if (randomNumbers.includes(randomNumber)) {
          i--;
        } else {
          randomNumbers.push(randomNumber);
          this.cards.push(cards[randomNumber]);
          this.cards.push(cards[randomNumber+1]);
          this.cards.push(cards[randomNumber+2]);
        }
      }

      this.esCards = this.shuffleArray(this.cards.filter((card, index) => index%3 === 0));
      this.itCards = this.shuffleArray(this.cards.filter((card, index) => (index+1)%3 === 0));
      this.enCards = this.shuffleArray(this.cards.filter((card, index) => (index+2)%3 === 0));

      if(this.isTwoColumns) {
        this.cards = this.twoColumnsArray(this.shuffleArray(this.esCards), this.shuffleArray(this.currentLanguage === 'us' ? this.enCards : this.itCards));
      } else {
        this.cards = this.shuffleArray(this.cards);
      }
    });
  }

  selectLanguage(event: any) {
    localStorage.setItem(LOCAL_STORAGE.CURRENT_LANGUAGE, event.value);
    this.loadCards();
  }

  toggleSound() {
    this.isSoundOn = !this.isSoundOn;
    localStorage.setItem(LOCAL_STORAGE.SOUND, JSON.stringify(this.isSoundOn));
  }

  toggleFlipEffect() {
    this.isFlipEffect = !this.isFlipEffect;
    localStorage.setItem(LOCAL_STORAGE.FLIP_EFFECT, JSON.stringify(this.isFlipEffect));
  }

  toggleColumns() {
    this.isTwoColumns = !this.isTwoColumns;
    if(this.isTwoColumns) {
      this.cards = this.twoColumnsArray(this.shuffleArray(this.esCards), this.shuffleArray(this.currentLanguage === 'us' ? this.enCards : this.itCards));
    } else {
      this.cards = this.shuffleArray(this.cards);
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  @HostListener('window:scroll',['$event']) onScroll() {
    this.isHeaderFixed = window.scrollY > STICKY_HEADER_FROM;
  }

  shuffleArray(array: Card[]): Card[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  twoColumnsArray(esCards: Card[], otherCards: Card[]): Card[] {
    return esCards.flatMap((card: Card, index) => {
      return [card, otherCards[index]];
    });
  }

  selectCard(card: Card) {
    // When the card is already selected then unselect it
    if (card.selected) {
      card.selected = false;
      this.isLastCardSelected = false;
      return;
    }

    // Speech
    if ('speechSynthesis' in window && this.isSoundOn) {
      this.utterThis.lang = this.esCards.some(esCard => esCard.id === card.id) ? 'es-ES' : (this.enCards.some(enCard => enCard.id === card.id) ? 'en-GB' : 'it-IT');

      // Change voice
      this.utterThis.pitch = 1;
      this.utterThis.rate = 0.8;
      // if (this.synth.getVoices().length > 0) {
      //   this.utterThis.voice = this.synth.getVoices()[8];
      // }

      this.synth.cancel();
      this.utterThis.text = card.value;
      this.synth.speak(this.utterThis);
    }

    // When it's the first card then save it as last selection and set the selected indicator to true
    if(!this.isLastCardSelected) {
      this.lastSelection = card;
      this.lastSelection.selected = true;
      this.isLastCardSelected = true;
      return;
    }

    // Othercase check if there is a match
    this.checkMatch(card);
  }

  // When there is a previous card selected, else save selected card
  checkMatch(card: Card) {
    // If the selection is blocked don't check the match
    if (this.isSelectionBlocked) { return }

    // Check match
    if(this.lastSelection) {
      if (this.isFlipEffect) {
        this.isSelectionBlocked = true;
      }

      card.selected = true;
      const isMatch = this.lastSelection.pairs.includes(card.id);
      card.match = isMatch;
      this.lastSelection.match = isMatch;

      // Update progress bar
      if (isMatch) {
        this.progress = this.progress + 2*100/this.cards.length;

        // Unselect both cards
        this.isLastCardSelected = false;
        this.lastSelection.selected = false;
        card.selected = false;
        this.isSelectionBlocked = false;
      } else {
        if (this.isFlipEffect) {
          setTimeout(() => {
            if(this.lastSelection) {
              // Unselect both cards
              this.isLastCardSelected = false;
              this.lastSelection.selected = false;
              card.selected = false;
              this.isSelectionBlocked = false;
            }
          }, 500);
        } else {
          if(this.lastSelection) {
            // Unselect both cards
            this.isLastCardSelected = false;
            this.lastSelection.selected = false;
            card.selected = false;
          }
        }
      }
    }
  }

  progressBarCompleted() {
    if (Math.round(this.progress) === 100) {
      clearInterval(this.timerInterval);
      this.openBottomSheet(`Completed in ${this.timeLeft} seconds!`);
    }
  }

  startTimer(timer: number = DEFAULT_TIMER) {
    this.timeLeft = timer;
    this.timerInterval = setInterval(() => {
      if(this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.openBottomSheet('Time expired!');
        clearInterval(this.timerInterval);
      }
    },1000)
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  openBottomSheet(data: string) {
    const bottomSheetRef = this.bottomSheet.open(BottomSheetComponent, {data: data , disableClose: true});

    bottomSheetRef.afterDismissed().subscribe(reload => {
      // TODO: shuffle the cards and reset the page instead reload it
      if (reload) {
        location.reload();
      }
    });
  }
}
