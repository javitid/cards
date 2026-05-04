import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HelperService {
  public isSmallScreen: boolean;

  constructor() {
    try {
      this.isSmallScreen = typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(max-width: 640px)').matches;
    } catch {
      this.isSmallScreen = false;
    }
  }
}
