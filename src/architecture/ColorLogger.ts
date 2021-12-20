import chalk = require('chalk')
import { Service } from 'typedi'
import { AbstractLogger } from './AbstractLogger'

/**
 * Colorful console logger.
 */
@Service()
export class ColorLogger implements AbstractLogger {
  debug(...args: any[]): void {
    console.log(chalk`{blue debug }${chalk(...args)}`)
  }
  info(...args: any[]): void {
    console.log(chalk`{green info }${chalk(...args)}`)
  }
  fine(...args: any[]): void {
    console.log(chalk(...args))
  }
  warn(...args: any[]): void {
    console.log(chalk`{yellow warn }${chalk(...args)}`)
  }
  error(...args: any[]): void {
    console.log(chalk`{red error }${chalk(...args)}`)
  }
  fatal(...args: any[]): void {
    console.log(chalk`{inverse {red FATAL}}${chalk(...args)}`)
  }
}
