import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthMongoDBGuard } from './guards/auth-mongodb.guard';
import { GameComponent } from './pages/game/game.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthMongoDBGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'game'
      },
      {
        path: 'game',
        component: GameComponent
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }