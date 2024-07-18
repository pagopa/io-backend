import * as t from "io-ts";
import * as express from "express";
import { enumType } from "@pagopa/ts-commons/lib/types";

export enum LoginTypeEnum {
  "LV" = "LV",
  "LEGACY" = "LEGACY",
}
export type LoginTypeT = t.TypeOf<typeof LoginType>;
export const LoginType = enumType<LoginTypeEnum>(LoginTypeEnum, "LoginType");

export type AdditionalLoginPropsT = t.TypeOf<typeof AdditionalLoginProps>;
export const AdditionalLoginProps = t.partial({ loginType: LoginType });

export const ActiveSessionInfo = t.type({
  ttl: t.number,
  type: LoginType,
});

export type ActiveSessionInfo = t.TypeOf<typeof ActiveSessionInfo>;

export const acsRequestMapper = (
  req: express.Request
): t.Validation<AdditionalLoginPropsT> =>
  AdditionalLoginProps.decode({
    loginType: req.header("x-pagopa-login-type"),
  });

// ----------------------------
// FF management
// ----------------------------

export const getLoginType = (
  loginType: LoginTypeEnum | undefined,
  isUserEligibleForFastLogin: boolean,
  isLollipopEnabled: boolean
): LoginTypeEnum =>
  isLollipopEnabled &&
  loginType === LoginTypeEnum.LV &&
  isUserEligibleForFastLogin
    ? LoginTypeEnum.LV
    : LoginTypeEnum.LEGACY;
