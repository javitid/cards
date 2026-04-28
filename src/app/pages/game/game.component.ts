import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-game',
  standalone: false,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly username = this.authService.username;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
