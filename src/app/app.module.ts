import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// import { AuthMongoDBGuard } from './guards/auth-mongodb.guard';
import { TokenGuard } from './guards/token.guard';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { CardModule } from './modules/card/card.module';
import { AppComponent } from './app.component';
import { GameComponent } from './pages/game/game.component';
import { GenerateComponent } from './pages/generate/generate.component';
import { LoginComponent } from './pages/login/login.component';

import { AuthMongoDBInterceptorService } from './services/auth-mongodb-interceptor.service';
import { AuthService } from './services/auth.service';
import { HelperService } from './utils/helper.service';
import { RegisterComponent } from './pages/register/register.component';

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    GenerateComponent,
    LoginComponent,
    RegisterComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,

    // Local
    SharedModule,

    // Cards
    CardModule,

    // Routing
    AppRoutingModule
  ],
  providers: [
    // AuthMongoDBGuard,
    TokenGuard,
    AuthService,
    HelperService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthMongoDBInterceptorService, multi: true },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill' }}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
