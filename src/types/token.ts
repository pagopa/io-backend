import { tag } from "@pagopa/ts-commons/lib/types";
import * as t from "io-ts";

interface ISessionTokenTag {
  readonly kind: "SessionToken";
}
export const SessionToken = tag<ISessionTokenTag>()(t.string);
export type SessionToken = t.TypeOf<typeof SessionToken>;
