import { Service } from '@angular/core';

/** A seam for logging: console today, a log shipper tomorrow. */
@Service()
export class Logger {
  info(message: string, ...details: unknown[]): void {
    console.info(`[ward] ${message}`, ...details);
  }
  warn(message: string, ...details: unknown[]): void {
    console.warn(`[ward] ${message}`, ...details);
  }
  error(message: string, ...details: unknown[]): void {
    console.error(`[ward] ${message}`, ...details);
  }
}
