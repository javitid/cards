import { Injectable } from '@angular/core';

@Injectable()
export class HelperService {
  public isSmallScreen: boolean;

  constructor() {
    this.isSmallScreen = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
  }
}