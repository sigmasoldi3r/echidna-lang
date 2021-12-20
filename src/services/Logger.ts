import { Inject, Service } from 'typedi'
import { AbstractLogger, LogLevel } from '../architecture/AbstractLogger'
import { ColorLogger } from '../architecture/ColorLogger'
import { Config } from './Config'

/**
 * Logger service.
 * Combines different providers to log information.
 */
@Service()
export class Logger implements AbstractLogger {
  @Inject(() => Config)
  private readonly config!: Config

  @Inject(() => ColorLogger)
  private readonly logger!: AbstractLogger

  debug(...args: any[]): void {
    if (this.config.logLevel <= LogLevel.DEBUG) {
      this.logger.debug(...args)
    }
  }
  info(...args: any[]): void {
    if (this.config.logLevel <= LogLevel.INFO) {
      this.logger.info(...args)
    }
  }
  fine(...args: any[]): void {
    if (this.config.logLevel <= LogLevel.INFO) {
      this.logger.fine(...args)
    }
  }
  warn(...args: any[]): void {
    if (this.config.logLevel <= LogLevel.INFO) {
      this.logger.warn(...args)
    }
  }
  error(...args: any[]): void {
    if (this.config.logLevel <= LogLevel.INFO) {
      this.logger.error(...args)
    }
  }
  fatal(...args: any[]): void {
    if (this.config.logLevel <= LogLevel.INFO) {
      this.logger.fatal(...args)
    }
  }
}
