import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// import { AuthMongoDBGuard } from './guards/auth-mongodb.guard';
import { TokenGuard } from './guards/token.guard';
import { GameComponent } from './pages/game/game.component';
import { GenerateComponent } from './pages/generate/generate.component';
import { LoginComponent } from './pages/login/login.component';

const routes: Routes = [
  {
    path: '',
    // Only it's needed to get a Bearer token if the login auth is not implemented, other case the token is retrieved in the login service response
    // canActivate: [AuthMongoDBGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
      },
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'game',
        component: GameComponent,
        canActivate: [TokenGuard]
      },
      {
        path: 'generate',
        component: GenerateComponent,
        canActivate: [TokenGuard]
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }