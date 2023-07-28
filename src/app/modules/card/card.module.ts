import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material
import { MatBottomSheetModule} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { CardComponent } from './components/card/card.component';
import { CardContainerComponent } from './components/card-container/card-container.component';
import { BottomSheetComponent } from './components/card-container/bottom-sheet/bottom-sheet.component';
import { UtilsService } from './utils/utils-service';

@NgModule({
  declarations: [
    CardComponent,
    CardContainerComponent,
    BottomSheetComponent
  ],
  imports: [
    CommonModule,

    // Material
    MatBottomSheetModule,
    MatButtonModule,
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
