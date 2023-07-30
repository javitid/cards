import { Component } from '@angular/core';
import { UtilsService } from '../../utils/utils.service';


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
    this.generatedJSON = JSON.stringify(this.utilsService.generateCards());
  }
}
