import * as t from "io-ts";

/**
 * Sets properties default values when calling t.validate() method on models
 * see https://github.com/gcanti/io-ts/issues/8
 */
// tslint:disable:no-any
export function withDefault<T extends t.Any>(
  type: T,
  defaultValue: t.TypeOf<T>
): t.Type<any, t.TypeOf<T>> {
  return new t.Type(
    type.name,
    (v: any): v is T => type.is(v),
    (v: any, c: any) =>
      type.validate(v !== undefined && v !== null ? v : defaultValue, c),
    (v: any) => type.encode(v)
  );
}
