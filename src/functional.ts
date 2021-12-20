/**
 * Function version of *throw* keyword. This version can be used in expression
 * place.
 */
export function raise<T extends ErrorConstructor>(
  prototype: T,
  ...args: Parameters<T>
): never {
  throw new prototype(...args)
}
