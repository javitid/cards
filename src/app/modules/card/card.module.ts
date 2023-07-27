import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'

import { CardComponent } from './components/card/card.component';
import { CardContainerComponent } from './components/card-container/card-container.component';

@NgModule({
  declarations: [
    CardComponent,
    CardContainerComponent
  ],
  imports: [
    CommonModule,

    // Material
    MatIconModule
  ],
  exports: [
    CardComponent,
    CardContainerComponent
  ]
})
export class CardModule { }
