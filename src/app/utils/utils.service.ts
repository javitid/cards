import { Injectable } from '@angular/core';
import { Card, Pair } from '../modules/card/interfaces/card';

@Injectable()
export class UtilsService {
  generateCards(pairs: Pair[]): Card[] {
    return pairs.flatMap((pair: Pair, index) => {
      return [
        {
          id: 3*index,
          icon: pair.icon,
          pairs: [3*index + 1, 3*index + 2],
          value: pair.es,
          match: false,
          selected: false
        },
        {
          id: 3*index + 1,
          icon: pair.icon,
          pairs: [3*index, 3*index + 2],
          value: pair.en,
          match: false,
          selected: false
        },
        {
          id: 3*index + 2,
          icon: pair.icon,
          pairs: [3*index, 3*index + 1],
          value: pair.it,
          match: false,
          selected: false
        }
      ];
    });
  }
}
