import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { CardComponent } from './components/card/card.component';
import { CardContainerComponent } from './components/card-container/card-container.component';
import { BottomSheetComponent } from './components/card-container/bottom-sheet/bottom-sheet.component';

@NgModule({
  declarations: [
    CardComponent,
    CardContainerComponent,
    BottomSheetComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    CardComponent,
    CardContainerComponent
  ]
})
export class CardModule { }
