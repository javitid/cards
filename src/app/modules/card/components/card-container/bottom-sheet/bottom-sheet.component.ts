import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-bottom-sheet',
  templateUrl: './bottom-sheet.component.html',
  styleUrls: ['./bottom-sheet.component.scss']
})
export class BottomSheetComponent {
  content = this.bottomSheetRef.instance;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA)public readonly data: any,
    private readonly bottomSheetRef: MatBottomSheetRef<BottomSheetComponent>
  ) {}

  newGame(event: MouseEvent): void {
    this.bottomSheetRef.dismiss(true);
    event.preventDefault();
  }
}
