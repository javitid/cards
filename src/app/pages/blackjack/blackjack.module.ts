import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TokenGuard } from '../../guards/token.guard';
import { SharedModule } from '../../shared/shared.module';
import { BlackjackComponent } from './blackjack.component';

const routes: Routes = [
  {
    path: '',
    component: BlackjackComponent,
    canActivate: [TokenGuard],
  },
];

@NgModule({
  declarations: [BlackjackComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
  ],
})
export class BlackjackModule {}
