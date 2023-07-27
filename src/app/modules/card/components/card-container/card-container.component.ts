import { Component, ViewEncapsulation } from '@angular/core';
import { Card } from '../../interfaces/card';

@Component({
  selector: 'app-card-container',
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CardContainerComponent {
  lastSelection: Card|undefined;

  cards: Card[] = [
    {
      id: 1,
      icon: 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
      pair: 2,
      value: 'Casa',
      match: false,
      selected: false
    },
    {
      id: 2,
      icon: 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
      pair: 1,
      value: 'House',
      match: false,
      selected: false
    },
    {
      id: 3,
      icon: 'M14.73,13.31C15.52,12.24,16,10.93,16,9.5C16,5.91,13.09,3,9.5,3S3,5.91,3,9.5C3,13.09,5.91,16,9.5,16 c1.43,0,2.74-0.48,3.81-1.27L19.59,21L21,19.59L14.73,13.31z M9.5,14C7.01,14,5,11.99,5,9.5S7.01,5,9.5,5S14,7.01,14,9.5 S11.99,14,9.5,14z',
      pair: 4,
      value: 'Coche',
      match: false,
      selected: false
    },
    {
      id: 4,
      icon: 'M14.73,13.31C15.52,12.24,16,10.93,16,9.5C16,5.91,13.09,3,9.5,3S3,5.91,3,9.5C3,13.09,5.91,16,9.5,16 c1.43,0,2.74-0.48,3.81-1.27L19.59,21L21,19.59L14.73,13.31z M9.5,14C7.01,14,5,11.99,5,9.5S7.01,5,9.5,5S14,7.01,14,9.5 S11.99,14,9.5,14z',
      pair: 3,
      value: 'Car',
      match: false,
      selected: false
    }
  ];

  selectCard(card: Card) {
    card.selected = !card.selected;

    this.cardsInfo(card);

    // if(this.lastSelection?.selected && card.id === this.lastSelection.pair) {
    //   card.match = true;
    //   this.lastSelection.match = true;
    // }

    if(this.lastSelection) {
      this.lastSelection = undefined;
    } else {
      this.lastSelection = card;
    }
  }

  cardsInfo(card: Card) {
    console.log('Last selection: ' + this.lastSelection?.value);
    console.log('Last selection selected: ' + this.lastSelection?.selected);
    console.log('Last selection match: ' + this.lastSelection?.match);
    console.log('Current selection: ' + card.value);
    console.log('Current selection selected: ' + card.selected);
    console.log('Current selection match: ' + card.match);
  }
}
