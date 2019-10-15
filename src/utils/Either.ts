import { Either, left, right } from "fp-ts/lib/Either";
import { Lazy } from "fp-ts/lib/function";

export function parseJSON<E>(
  s: string,
  onError: (reason: unknown) => E
): Either<E, unknown> {
  return tryCatch(() => JSON.parse(s), onError);
}

export function stringifyJSON<E>(
  u: unknown,
  onError: (reason: unknown) => E
): Either<E, string> {
  return tryCatch(() => JSON.stringify(u), onError);
}

export function tryCatch<E, A>(
  f: Lazy<A>,
  onError: (e: unknown) => E
): Either<E, A> {
  try {
    return right(f());
  } catch (e) {
    return left(onError(e));
  }
}
