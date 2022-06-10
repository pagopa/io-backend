import * as t from "io-ts";
import { tag } from "@pagopa/ts-commons/lib/types";
import { PecServerConfig } from "src/config";
import * as TE from "fp-ts/TaskEither";

interface ISessionTokenTag {
  readonly kind: "SessionToken";
}
export const SessionToken = tag<ISessionTokenTag>()(t.string);
export type SessionToken = t.TypeOf<typeof SessionToken>;

interface IWalletTokenTag {
  readonly kind: "WalletToken";
}
export const WalletToken = tag<IWalletTokenTag>()(t.string);
export type WalletToken = t.TypeOf<typeof WalletToken>;

interface IMyPortalTokenTag {
  readonly kind: "MyPortalToken";
}
export const MyPortalToken = tag<IMyPortalTokenTag>()(t.string);
export type MyPortalToken = t.TypeOf<typeof MyPortalToken>;

interface IBPDTokenTag {
  readonly kind: "BPDToken";
}
export const BPDToken = tag<IBPDTokenTag>()(t.string);
export type BPDToken = t.TypeOf<typeof BPDToken>;

interface IZendeskTokenTag {
  readonly kind: "ZendeskToken";
}
export const ZendeskToken = tag<IZendeskTokenTag>()(t.string);
export type ZendeskToken = t.TypeOf<typeof ZendeskToken>;

interface IFIMSTokenTag {
  readonly kind: "FIMSTokenTag";
}
export const FIMSToken = tag<IFIMSTokenTag>()(t.string);
export type FIMSToken = t.TypeOf<typeof FIMSToken>;

export type PecBearerGeneratorT = (
  config: PecServerConfig
) => TE.TaskEither<Error, string>;
