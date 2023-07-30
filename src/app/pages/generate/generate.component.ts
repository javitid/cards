import { Component } from '@angular/core';
import { UtilsService } from '../../utils/utils.service';
import { Pair } from '../../modules/card/interfaces/card';

// TODO: fill from screen input and do a request to MongoDB server to update the Data Base
// Add new elements to generate the cards
const pairs: Pair[] = [
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

@Component({
  selector: 'app-generate',
  templateUrl: './generate.component.html',
  styleUrls: ['./generate.component.scss']
})
export class GenerateComponent {
  generatedJSON = '';

  constructor( private readonly utilsService: UtilsService ) {}

  // Generate array of pairs
  generateJSON() {
    this.generatedJSON = JSON.stringify(this.utilsService.generateCards(pairs));
  }
}
