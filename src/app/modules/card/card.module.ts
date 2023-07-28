import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'

import { CardComponent } from './components/card/card.component';
import { CardContainerComponent } from './components/card-container/card-container.component';
import { UtilsService } from './utils/utils-service';

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
  ],
  providers: [
    UtilsService
  ]
})
export class CardModule { }
