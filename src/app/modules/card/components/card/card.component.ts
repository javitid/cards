import { Component, Input } from '@angular/core';
import { Card } from '../../interfaces/card';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  @Input()
  card!: Card;

  selectCard(item: Card) {
    console.log(item.value);
  }
}
