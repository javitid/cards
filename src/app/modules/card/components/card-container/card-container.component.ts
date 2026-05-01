import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewEncapsulation, inject } from '@angular/core';

import { Card } from '../../interfaces/card';
import { GameFacade } from '../../services/game-facade.service';

const STICKY_HEADER_FROM = 30;

@Component({
  selector: 'app-card-container',
  standalone: false,
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardContainerComponent implements OnInit, OnDestroy {
  @Input() username = '';
  @Output() logoutRequested = new EventEmitter<void>();

  readonly facade = inject(GameFacade);
  readonly languages = this.facade.languages;

  isGameDialogVisible = false;
  isLeaderboardDialogVisible = false;
  isMenuOpen = false;
  isHeaderFixed = false;
  isMenuShown = true;

  ngOnInit(): void {
    this.facade.loadCards();
  }

  ngOnDestroy(): void {
    this.facade.dispose();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isHeaderFixed = window.scrollY > STICKY_HEADER_FROM;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  selectLanguage(event: { value?: string } | string): void {
    this.facade.selectLanguage(event);
    this.closeMenu();
  }

  toggleSound(): void {
    this.facade.toggleSound();
    this.closeMenu();
  }

  toggleFlipEffect(): void {
    this.facade.toggleFlipEffect();
    this.closeMenu();
  }

  toggleColumns(): void {
    this.facade.toggleColumns();
    this.closeMenu();
  }

  selectCard(card: Card): void {
    this.facade.selectCard(card);
  }

  saveCompletedGame(): void {
    this.facade.saveCompletedGame();
  }

  startNewGame(): void {
    this.facade.startNewGameFromUi();
    this.closeMenu();
  }

  openLeaderboard(): void {
    this.isLeaderboardDialogVisible = true;
    this.closeMenu();
  }

  updatePlayerName(name: string): void {
    this.facade.setPlayerName(name);
  }

  closeGameDialog(reload = false): void {
    this.facade.closeGameDialog(reload);
  }
}
