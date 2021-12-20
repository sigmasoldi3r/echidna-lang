import { Service } from 'typedi'
import { LogLevel } from '../architecture/AbstractLogger'

@Service()
export class Config {
  logLevel: LogLevel = LogLevel.INFO
}
