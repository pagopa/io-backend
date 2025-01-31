import { enumType } from "@pagopa/ts-commons/lib/types";
import * as t from "io-ts";

export enum LoginTypeEnum {
  "LEGACY" = "LEGACY",
  "LV" = "LV",
}
export type LoginTypeT = t.TypeOf<typeof LoginType>;
export const LoginType = enumType<LoginTypeEnum>(LoginTypeEnum, "LoginType");

export const ActiveSessionInfo = t.type({
  ttl: t.number,
  type: LoginType,
});
export type ActiveSessionInfo = t.TypeOf<typeof ActiveSessionInfo>;
