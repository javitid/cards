import { Injectable } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';

@Injectable()
export class HelperService {
  public isSmallScreen: boolean;

  constructor(private _breakpointObserver: BreakpointObserver) {
    this.isSmallScreen = this._breakpointObserver.isMatched('(max-width: 640px)');
  }
}