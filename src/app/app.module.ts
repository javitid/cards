import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';
import { MessageService } from 'primeng/api';
import { PrimeNG } from 'primeng/config';

import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';

const BlueWhitePreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f8fbff',
          100: '#f1f7ff',
          200: '#e6f0fb',
          300: '#d6e4f5',
          400: '#b4c7df',
          500: '#7b93b2',
          600: '#5f7796',
          700: '#475d79',
          800: '#31445f',
          900: '#1f3046',
          950: '#142235',
        },
      },
    },
  },
});

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,

    // Local
    SharedModule,

    // Routing
    AppRoutingModule
  ],
  providers: [
    MessageService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private readonly primeng: PrimeNG) {
    this.primeng.setConfig({
      theme: {
        preset: BlueWhitePreset,
        options: {
          darkModeSelector: 'none',
        },
      },
    });
  }
}
