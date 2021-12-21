import { Option } from '../architecture/Option'

/**
 * Base exception type.
 */
export class CompilerException extends Error {
  constructor(message?: string, public readonly cause?: Option<Error>) {
    super(message)
  }
}
