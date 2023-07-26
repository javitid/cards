import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Card } from '../../interfaces/card';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  @Input()
  card!: Card;

  @Output()
  selectCard = new EventEmitter<Card>();
}
