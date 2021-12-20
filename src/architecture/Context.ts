import { Indent } from './Indent'
import { Option } from './Option'

export class Local<T extends string = 'any'> {
  constructor(
    readonly name: string,
    readonly exported: boolean,
    readonly type: T,
    readonly ambient: Option<Context> = null,
  ) {}
}

export class Context {
  readonly locals = new Map<string, Local>()
  constructor(readonly parent: Option<Context> = null) {}
  private readonly indent: Indent = this.parent?.indent?.up ?? new Indent(0)
}
