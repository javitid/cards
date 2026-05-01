import { Injectable, signal } from '@angular/core';

@Injectable()
export class GameTimerService {
  readonly timeLeft = signal(60);

  private timerInterval?: ReturnType<typeof setInterval>;

  start(durationSeconds: number, onFinished: () => void): void {
    this.stop();
    this.timeLeft.set(durationSeconds);

    this.timerInterval = setInterval(() => {
      if (this.timeLeft() > 0) {
        this.timeLeft.set(this.timeLeft() - 1);
        return;
      }

      this.stop();
      onFinished();
    }, 1000);
  }

  stop(): void {
    if (!this.timerInterval) {
      return;
    }

    clearInterval(this.timerInterval);
    this.timerInterval = undefined;
  }
}
