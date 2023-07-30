import { NgModule } from '@angular/core';

// Material
import { MatBottomSheetModule} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { HelperService } from '../utils/helper.service';
import { UtilsService } from '../utils/utils.service';

const UI = [
  MatBottomSheetModule,
  MatButtonModule,
  MatGridListModule,
  MatIconModule,
  MatProgressBarModule
];

@NgModule({
  exports: [
    UI
  ],
  imports: [
    UI
  ],
  providers: [
    HelperService,
    UtilsService
  ]
})
export class SharedModule { }
