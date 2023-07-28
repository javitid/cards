import { Component, ViewEncapsulation } from '@angular/core';

import { Card } from '../../interfaces/card';
import { DataService } from '../../../../services/data.service';
import { UtilsService } from '../../utils/utils-service';

@Component({
  selector: 'app-card-container',
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CardContainerComponent {
  lastSelection: Card|undefined;
  isLastCardSelected = false;
  cards: Card[] = [];

  constructor(
    private readonly dataService: DataService,
    private readonly utilsService: UtilsService
  ) {

    // Generate array of pairs
    // console.log(this.utilsService.generateCards());

    this.dataService.getCards().subscribe( (cards: Card[]) => {
      this.cards = this.shuffleArray(cards);
    });
  }

  shuffleArray(array: Card[]): Card[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  selectCard(card: Card) {
    // When the card is already selected then unselect it
    if (card.selected) {
      card.selected = false;
      this.isLastCardSelected = false;
      return;
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
    if(this.lastSelection) {
      // Check match
      const isMatch = card.id === this.lastSelection.pair;
      card.match = isMatch;
      this.lastSelection.match = isMatch;

      // Unselect both cards
      this.isLastCardSelected = false;
      this.lastSelection.selected = false;
      card.selected = false;
    }
  }
}
