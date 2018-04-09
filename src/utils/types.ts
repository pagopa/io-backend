// tslint:disable:no-any
import * as t from "io-ts";

import { Set as SerializableSet } from "json-set-map";

/**
 * An io-ts Type tagged with T
 */
export type Tagged<T, S extends t.mixed, A> = t.Type<A & T, S>;

/**
 * Tags an io-ts type with an interface T
 */
export const tag = <T>() => <S, A>(type: t.Type<A, S>): Tagged<T, S, A> =>
  type as any;

const getObjectValues = <T extends object>(obj: T): ReadonlyArray<string> =>
  Object.keys(obj).reduce<ReadonlyArray<string>>(
    (acc, key) => [...acc, (obj as any)[key]],
    []
  );

/**
 * Creates an io-ts Type from an enum
 */
export const enumType = <E>(e: {}, name: string): t.Type<any, E> => {
  const values = getObjectValues(e);
  const isE: (v: any) => boolean = v =>
    typeof v === "string" && values.indexOf(v) >= 0;
  return new t.Type<any, E>(
    name,
    (v): v is E => isE(v),
    (v, c) => (isE(v) ? t.success(v) : t.failure(v, c)),
    t.identity
  );
};

/**
 * Creates an io-ts Type from a ReadonlySet
 */
export const readonlySetType = <E>(
  o: t.Type<E, t.mixed>,
  name: string
): t.Type<ReadonlySet<E>, t.mixed> => {
  const arrayType = t.readonlyArray(o, name);
  return new t.Type<ReadonlySet<E>, t.mixed>(
    name,
    (s): s is ReadonlySet<E> => s instanceof Set && arrayType.is(Array.from(s)),
    (s, c) => {
      if (s instanceof Set && arrayType.is(Array.from(s))) {
        return t.success(s);
      }
      if (arrayType.is(s)) {
        return t.success(new SerializableSet(Array.from(s)));
      }
      return t.failure(s, c);
    },
    t.identity
  );
};

/**
 * Returns a new type that has only the F fields of type T.
 */
export type LimitedFields<T, F extends keyof T> = { [P in F]: T[P] };

/**
 *  True when the input is an object (and not array).
 */
export const isObject = (o: {}) =>
  o instanceof Object && o.constructor === Object;

/**
 * Return an object filtering out keys that point to undefined values.
 */
export function withoutUndefinedValues<T, K extends keyof T>(obj: T): T {
  // note that T has been already validated by the type system and we can
  // be sure now that only attributes that may be undefined can be actually
  // filtered out by the following code, so the output type T is always
  // a valid T
  const keys = Object.keys(obj);
  return keys.reduce(
    (acc, key) => {
      const value = obj[key as K];
      return value !== undefined
        ? {
            // see https://github.com/Microsoft/TypeScript/pull/13288
            // tslint:disable-next-line:no-any
            ...(acc as any),
            // tslint:disable-next-line:no-any
            [key]: isObject(value as any)
              ? withoutUndefinedValues(value)
              : value
          }
        : acc;
    },
    {} as T
  ) as T;
}
