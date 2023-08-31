import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-bottom-sheet',
  templateUrl: './bottom-sheet.component.html',
  styleUrls: ['./bottom-sheet.component.scss']
})
export class BottomSheetComponent {
  constructor(private readonly bottomSheetRef: MatBottomSheetRef<BottomSheetComponent>) {}

  newGame(event: MouseEvent): void {
    this.bottomSheetRef.dismiss(true);
    event.preventDefault();
  }
}
