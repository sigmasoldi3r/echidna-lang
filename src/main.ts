import 'reflect-metadata'
import Container from 'typedi'
import { Compiler } from './architecture/Compiler'
import { CompilerProvider } from './services/CompilerProvider'

const c = Container.get(CompilerProvider)
const cp = c.byEmitter({
  compile() {},
})

cp.compile('asdasd puta dgjfjg', process.stdout, 'fail-test')

cp.compile('let x = 1 + 1\n', process.stdout, 'success-test')
