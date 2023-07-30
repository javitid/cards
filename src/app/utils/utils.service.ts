import { Injectable } from '@angular/core';
import { Card, Pair } from '../modules/card/interfaces/card';

@Injectable()
export class UtilsService {
  generateCards(pairs: Pair[]): Card[] {
    return pairs.flatMap((pair: Pair, index) => {
      return [
        {
          id: 2*index,
          icon: pair.icon,
          pair: 2*index + 1,
          value: pair.es,
          match: false,
          selected: false
        },
        {
          id: 2*index + 1,
          icon: pair.icon,
          pair: 2*index,
          value: pair.en,
          match: false,
          selected: false
        },
      ];
    });
  }
}
