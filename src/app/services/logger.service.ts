import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  error(message: string, ...args: unknown[]): void {
    console.error(`[Cards] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[Cards] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`[Cards] ${message}`, ...args);
  }
}
