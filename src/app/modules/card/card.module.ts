import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
    MatIconModule,
    MatProgressBarModule
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
