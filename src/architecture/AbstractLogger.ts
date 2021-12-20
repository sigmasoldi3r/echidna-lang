/**
 * Logging levels
 */
export enum LogLevel {
  DEBUG,
  INFO,
  FINE,
  WARN,
  ERROR,
  FATAL,
}

/**
 * Abstract logging interface
 */
export interface AbstractLogger {
  debug(...args: any[]): void
  info(...args: any[]): void
  fine(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
  fatal(...args: any[]): void
}
