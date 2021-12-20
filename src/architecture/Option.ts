/**
 * Optional type.
 * May be not present.
 */
export type Option<T> = T extends null ? never : T | null
