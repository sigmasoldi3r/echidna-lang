import { CodeLocation } from '../architecture/Compiler'
import { CompilerException } from './CompilerException'

export class CodeException extends CompilerException {
  constructor(
    readonly location: CodeLocation,
    message?: string,
    cause?: Error,
  ) {
    super(message, cause)
  }
}
