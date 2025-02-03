import * as t from "io-ts";
import { enumType } from "@pagopa/ts-commons/lib/types";

export enum LoginTypeEnum {
  "LV" = "LV",
  "LEGACY" = "LEGACY"
}
export type LoginTypeT = t.TypeOf<typeof LoginType>;
export const LoginType = enumType<LoginTypeEnum>(LoginTypeEnum, "LoginType");

export const ActiveSessionInfo = t.type({
  ttl: t.number,
  type: LoginType
});
export type ActiveSessionInfo = t.TypeOf<typeof ActiveSessionInfo>;
