import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

import { AuthMongoDBGuard } from './guards/auth-mongodb.guard';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CardModule } from './modules/card/card.module';
import { GameComponent } from './pages/game/game.component';

import { AuthMongoDBInterceptorService } from './services/auth-mongodb-interceptor.service';
import { AuthService } from './services/auth.service';
import { HelperService } from './services/helper.service';

@NgModule({
  declarations: [
    AppComponent,
    GameComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,

    // Material
     MatSnackBarModule,

    // Cards
    CardModule
  ],
  providers: [
    AuthMongoDBGuard,
    AuthService,
    HelperService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthMongoDBInterceptorService, multi: true },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 2500} }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
