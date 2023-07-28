import { Injectable } from '@angular/core';
import { Card, Pair } from '../interfaces/card';

// Add new elements to generate the cards
export const pairs: Pair[] = [
  {
    icon: 'home',
    es: 'Casa',
    en: 'Home'
  },
  {
    icon: 'directions_car',
    es: 'Coche',
    en: 'Car'
  },
  {
    icon: 'wb_cloudy',
    es: 'Nube',
    en: 'Cloud'
  },
  {
    icon: 'beach_access',
    es: 'Playa',
    en: 'Beach'
  },
  {
    icon: 'flight',
    es: 'Avión',
    en: 'Plane'
  },
  {
    icon: 'arrow_forward',
    es: 'Flecha',
    en: 'Arrow'
  },
  {
    icon: 'close',
    es: 'Cruz',
    en: 'Cross'
  }
];

@Injectable()
export class UtilsService {
  generateCards(): Card[] {
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
