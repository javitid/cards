import { NgModule } from '@angular/core';

// Material
import { MatBottomSheetModule} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

import { HelperService } from '../utils/helper.service';
import { UtilsService } from '../utils/utils.service';

const UI = [
  MatBottomSheetModule,
  MatButtonModule,
  MatIconModule,
  MatProgressBarModule,
  MatSnackBarModule
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
    UtilsService,
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 2500} }
  ]
})
export class SharedModule { }
