export const isNil = <T>(v: T | null | undefined): v is null | undefined =>
  v === null || v === undefined

export const isNotNil = <T>(v: T | null | undefined): v is T => !isNil(v)

export const isUndefined = <T>(v: T | null | undefined): v is undefined =>
  v === undefined

export const isNotUndefined = <T>(v: T | null | undefined): v is T =>
  !isUndefined(v)

export const isString = (v: unknown): v is string => typeof v === 'string'
