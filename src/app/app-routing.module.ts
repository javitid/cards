import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
      },
      {
        path: 'login',
        loadChildren: () => import('./pages/login/login.module').then((m) => m.LoginModule),
      },
      {
        path: 'game',
        loadChildren: () => import('./pages/game/game.module').then((m) => m.GameModule),
      },
      {
        path: 'blackjack',
        loadChildren: () => import('./pages/blackjack/blackjack.module').then((m) => m.BlackjackModule),
      },
      {
        path: 'generate',
        loadChildren: () => import('./pages/generate/generate.module').then((m) => m.GenerateModule),
      },
      {
        path: 'register',
        loadChildren: () => import('./pages/register/register.module').then((m) => m.RegisterModule),
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
