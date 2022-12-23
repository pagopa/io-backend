import { enumType } from "@pagopa/ts-commons/lib/types";
import * as t from "io-ts";

export enum FeatureFlagEnum {
  ALL = "ALL",
  BETA = "BETA",
  CANARY = "CANARY",
  NONE = "NONE"
}

export const FeatureFlag = enumType<FeatureFlagEnum>(
  FeatureFlagEnum,
  "FeatureFlag"
);

export type FeatureFlag = t.TypeOf<typeof FeatureFlag>;

export const getIsUserEligibleForNewFeature = <T>(
  isUserBeta: (i: T) => boolean,
  isUserCanary: (i: T) => boolean,
  featureFlag: FeatureFlag
): ((i: T) => boolean) => (i): boolean => {
  switch (featureFlag) {
    case "ALL":
      return true;
    case "BETA":
      return isUserBeta(i);
    case "CANARY":
      return isUserCanary(i) || isUserBeta(i);
    case "NONE":
      return false;
    default:
      return false;
  }
};
