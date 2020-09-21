import { and as simpleAnd, Predicate } from "fp-ts/lib/function";

export const and = <A>(
  p1: Predicate<A>,
  ...predicates: ReadonlyArray<Predicate<A>>
) => {
  return predicates.reduce((acc, predicate) => {
    return simpleAnd(acc, predicate);
  }, p1);
};
