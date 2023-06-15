import * as t from "io-ts";
import * as express from "express";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { enumType } from "@pagopa/ts-commons/lib/types";
import { FeatureFlag, getIsUserEligibleForNewFeature } from "./featureFlag";

export enum LoginTypeEnum {
  "LV" = "LV",
  "STANDARD" = "STANDARD",
}
export type LoginTypeT = t.TypeOf<typeof LoginType>;
export const LoginType = enumType<LoginTypeEnum>(LoginTypeEnum, "LoginType");

export type AdditionalLoginPropsT = t.TypeOf<typeof AdditionalLoginProps>;
export const AdditionalLoginProps = t.partial({ loginType: LoginType });

export const acsRequestMapper = (
  req: express.Request
): t.Validation<AdditionalLoginPropsT> =>
  AdditionalLoginProps.decode({
    loginType: req.header("x-pagopa-login-type"),
  });

// ----------------------------
// FF management
// ----------------------------

export const getIsUserElegibleForfastLogin = (
  betaTesters: ReadonlyArray<FiscalCode>,
  FF_FastLogin: FeatureFlag
) =>
  getIsUserEligibleForNewFeature<FiscalCode>(
    (fiscalCode) => betaTesters.includes(fiscalCode),
    (_fiscalCode) => false,
    FF_FastLogin
  );
