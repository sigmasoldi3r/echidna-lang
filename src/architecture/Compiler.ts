import { CodeEmitter } from './CodeEmitter'
import * as grammar from '../grammar'
import { Writable } from 'stream'
import Container from 'typedi'
import { Logger } from '../services/Logger'
import { trying } from './Result'

export interface CodeLocation {
  source: string
  start: {
    offset: number
    line: number
    column: number
  }
  end: {
    offset: number
    line: number
    column: number
  }
}

export type LocatedNode = { location: CodeLocation }

export class Compiler<T extends CodeEmitter> {
  private readonly logger = Container.get(Logger)

  constructor(private readonly emitter: T) {}

  private readonly tryParse = (src: string, grammarSource: string) =>
    trying(() => {
      return grammar.parse(src, { grammarSource })
    })

  compile(src: string, out: Writable, sourceName: string) {
    const result = this.tryParse(src, sourceName)
    if (result.isFailure()) {
      this.logger.error(result.cause)
    } else {
      this.logger.info(JSON.stringify(result.value, null, 2))
    }
  }
}
