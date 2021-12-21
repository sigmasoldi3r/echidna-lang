import { Writable } from 'stream'
import { CodeEmitter } from '../architecture/CodeEmitter'

export class Lua implements CodeEmitter {
  constructor(private out: Writable) {}
}
