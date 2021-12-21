import { Option } from './Option'

export class FailedResult extends Error {
  constructor(readonly cause: Error, message?: string) {
    super(message)
  }
}

/**
 * Abstract operation result.
 */
const AbstractResult = class Result<T> {
  unwrap(): T {
    throw new Error('Attempting to call pure virtual method')
  }
  ifValue(_unwrap: (value: T) => void): void {
    throw new Error('Attempting to call pure virtual method')
  }
  get(): Option<T> {
    throw new Error('Attempting to call pure virtual method')
  }
  getOr(fallback: T): T {
    throw new Error('Attempting to call pure virtual method')
  }
  isSuccess(): this is Success<T> {
    return this instanceof Success
  }
  isFailure(): this is Failure<T> {
    return this instanceof Failure
  }
}

/**
 * The result of an operation, which is either a successful operation, or a
 * failed operation.
 */
export type Result<T> = Success<T> | Failure<T>

/**
 * Build a success result.
 */
export function success<T>(value: T) {
  return new Success(value)
}

/**
 * Build a failure result.
 */
export function failure<T>(error: Error) {
  return new Failure<T>(error)
}

/**
 * Attempts to run the function and wraps the process by trying-and-catching.
 */
export function trying<T>(what: () => T): Result<T> {
  try {
    return success(what())
  } catch (err) {
    return failure(err as Error)
  }
}

/**
 * Failed result, carries an error.
 */
export class Failure<T> extends AbstractResult<T> {
  constructor(readonly cause: Error) {
    super()
  }
  override getOr(fallback: T): T {
    return fallback
  }
  override ifValue(unwrap: (value: T) => void): void {}
  override get(): Option<T> {
    return null as Option<T>
  }
  override unwrap(): T {
    throw new FailedResult(this.cause)
  }
}

/**
 * Successful result.
 */
export class Success<T> extends AbstractResult<T> {
  constructor(readonly value: T) {
    super()
  }
  override ifValue(unwrap: (value: T) => void): void {
    unwrap(this.value)
  }
  override get(): Option<T> {
    return this.value as Option<T>
  }
  override getOr(fallback: T): T {
    return this.value
  }
  override unwrap(): T {
    return this.value
  }
}
