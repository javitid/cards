import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TokenGuard } from '../../guards/token.guard';
import { CardModule } from '../../modules/card/card.module';
import { GameFacade } from '../../modules/card/services/game-facade.service';
import { GameLeaderboardService } from '../../modules/card/services/game-leaderboard.service';
import { GameTimerService } from '../../modules/card/services/game-timer.service';
import { SharedModule } from '../../shared/shared.module';
import { GameComponent } from './game.component';

const routes: Routes = [
  {
    path: '',
    component: GameComponent,
    canActivate: [TokenGuard],
  },
];

@NgModule({
  declarations: [GameComponent],
  imports: [
    CardModule,
    SharedModule,
    RouterModule.forChild(routes),
  ],
  providers: [
    GameFacade,
    GameLeaderboardService,
    GameTimerService,
  ],
})
export class GameModule {}
