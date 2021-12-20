import { Service } from 'typedi'

@Service()
export class SymbolTranslationTable {
  readonly symbols = new Map<string, string>()
  readonly seen = new Set<string>()

  get(name: string): string {
    {
      const sane = this.symbols.get(name)
      if (sane != null) {
        return sane
      }
    }
    const base = name.replace(/^([0-9])/, '_$1').replace(/[^0-9A-Za-z_]/g, '')
    let count = 0
    let sane = base
    while (this.seen.has(sane)) {
      sane = `${base}x${(count++).toString(16)}`
    }
    this.symbols.set(name, sane)
    this.seen.add(sane)
    return sane
  }
}
