import { Component, HostListener, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { BottomSheetComponent } from './bottom-sheet/bottom-sheet.component';
import { Card } from '../../interfaces/card';
import { DataService } from '../../../../services/data.service';
import { HelperService } from '../../../../utils/helper.service';

const DEFAULT_TIMER = 60;
const PAIRS_AMOUNT = 5;
const STICKY_HEADER_FROM = 30;

@Component({
  selector: 'app-card-container',
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CardContainerComponent implements OnDestroy {
  cards: Card[] = [];
  esCards: Card[] = [];
  enCards: Card[] = [];
  isFlipEffect = false;
  isHeaderFixed = false;
  isLastCardSelected = false;
  isSelectionBlocked = false; // To avoid a new card selection before timeout expires
  isTwoColumns: boolean;
  lastSelection: Card|undefined;
  progress = 0;

  // TIMER
  timeLeft = DEFAULT_TIMER;
  timerInterval: any;

  // TEXT TO SPEECH
  isSoundOn = true;
  private synth = window.speechSynthesis;
  private utterThis = new SpeechSynthesisUtterance();

  constructor(
    private readonly bottomSheet: MatBottomSheet,
    private readonly dataService: DataService,
    private readonly helperService: HelperService
  ) {

    this.startTimer();
    this.isTwoColumns = helperService.isSmallScreen;
    this.dataService.getCards().subscribe( (cards: Card[]) => {
      // Get PAIRS_AMOUNT random numbers to show only these elements instead the full array.
      let randomNumbers: number[] = [];
      this.cards = [];
      for(let i = 0; i < PAIRS_AMOUNT; i++) {
        // Only even numbers
        let randomNumber = Math.floor(Math.random() * cards.length/2) * 2;

        if (randomNumbers.includes(randomNumber)) {
          i--;
        } else {
          randomNumbers.push(randomNumber);
          this.cards.push(cards[randomNumber]);
          this.cards.push(cards[randomNumber+1]);
        }
      }

      this.esCards = this.shuffleArray(this.cards.filter((card, index) => index%2 === 0));
      this.enCards = this.shuffleArray(this.cards.filter((card, index) => index%2 === 1));
      if(this.isTwoColumns) {
        this.cards = this.twoColumnsArray(this.shuffleArray(this.esCards), this.shuffleArray(this.enCards));
      } else {
        this.cards = this.shuffleArray(this.cards);
      }
    });
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

  twoColumnsArray(esCards: Card[], enCards: Card[]): Card[] {
    return esCards.flatMap((card: Card, index) => {
      return [card, enCards[index]];
    });
  }

  toggleColumns() {
    this.isTwoColumns = !this.isTwoColumns;
    if(this.isTwoColumns) {
      this.cards = this.twoColumnsArray(this.shuffleArray(this.esCards), this.shuffleArray(this.enCards));
    } else {
      this.cards = this.shuffleArray(this.cards);
    }
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
      this.utterThis.lang = this.esCards.some(esCard => esCard.id === card.id) ? 'es-ES' : 'en-GB';

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
      const isMatch = card.id === this.lastSelection.pair;
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
