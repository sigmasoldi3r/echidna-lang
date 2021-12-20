import { Writable } from 'stream'

/**
 * Indent printer, a helper class for writing indented text to streams.
 */
export class Indent {
  constructor(readonly level: number, readonly tab: string = '  ') {}

  get tabs(): string {
    if (this.level <= 0) return ''
    return this.tab.repeat(this.level)
  }

  indent(fn: (level: Indent) => void) {
    const up = this.up
    fn(up)
  }

  write(to: Writable, ...args: any[]) {
    args.forEach(arg => to.write(String(to)))
  }

  get up(): Indent {
    return new Indent(this.level + 1, this.tab)
  }

  toString() {
    return this.tabs
  }
}
