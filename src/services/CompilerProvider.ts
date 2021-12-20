import { Service } from 'typedi'
import { CodeEmitter } from '../architecture/CodeEmitter'
import { Compiler } from '../architecture/Compiler'

@Service()
export class CompilerProvider {
  byEmitter<T extends CodeEmitter>(instance: T): Compiler<T> {
    return new Compiler<T>(instance)
  }
}
