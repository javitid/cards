import { Injectable } from '@angular/core';
import { Card, Pair } from '../modules/card/interfaces/card';

@Injectable()
export class UtilsService {
  generateCards(pairs: Pair[], languages: string[]): Card[] {
    const cardsForEachPair = languages.length;
    return pairs.flatMap((pair: Pair, index) => {
      return [
        {
          id: cardsForEachPair*index,
          icon: pair.icon,
          voice: 'es-ES',
          pairs: [cardsForEachPair*index + 1, cardsForEachPair*index + 2, cardsForEachPair*index + 3, cardsForEachPair*index + 4],
          value: pair.es,
          match: false,
          selected: false
        },
        {
          id: cardsForEachPair*index + 1,
          icon: pair.icon,
          voice: 'en-GB',
          pairs: [cardsForEachPair*index, cardsForEachPair*index + 2, cardsForEachPair*index + 3, cardsForEachPair*index + 4],
          value: pair.gb,
          match: false,
          selected: false
        },
        {
          id: cardsForEachPair*index + 2,
          icon: pair.icon,
          voice: 'it-IT',
          pairs: [cardsForEachPair*index, cardsForEachPair*index + 1, cardsForEachPair*index + 3, cardsForEachPair*index + 4],
          value: pair.it,
          match: false,
          selected: false
        },
        {
          id: cardsForEachPair*index + 3,
          icon: pair.icon,
          voice: 'pt-PT',
          pairs: [cardsForEachPair*index, cardsForEachPair*index + 1, cardsForEachPair*index + 2, cardsForEachPair*index + 4],
          value: pair.pt,
          match: false,
          selected: false
        },
        {
          id: cardsForEachPair*index + 4,
          icon: pair.icon,
          voice: 'de-DE',
          pairs: [cardsForEachPair*index, cardsForEachPair*index + 1, cardsForEachPair*index + 2, cardsForEachPair*index + 3],
          value: pair.de,
          match: false,
          selected: false
        }
      ];
    });
  }
}
