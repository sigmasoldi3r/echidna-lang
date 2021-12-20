import { CodeEmitter } from './CodeEmitter'

export class Compiler<T extends CodeEmitter> {
  constructor(private readonly emitter: T) {}
}
