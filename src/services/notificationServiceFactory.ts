import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as B from "fp-ts/boolean";
import { flow } from "fp-ts/lib/function";

import { FiscalCode } from "../../generated/io-bonus-api/FiscalCode";
import {
  FeatureFlag,
  getIsUserEligibleForNewFeature
} from "../utils/featureFlag";
import { toFiscalCodeHash } from "../types/notification";

import NotificationService from "./notificationService";

/**
 *
 * @param regex The regex to use
 * @returns
 */
const getIsUserACanaryTestUser = (
  regex: string
): ((sha: NonEmptyString) => boolean) => {
  const regExp = new RegExp(regex);
  return (sha: NonEmptyString): boolean => regExp.test(sha);
};

// ------------------------------------------

export type NotificationServiceFactory = (
  fiscalCode: FiscalCode
) => NotificationService;

export const getNotificationServiceFactory: (
  oldNotificationService: NotificationService,
  newNotificationService: NotificationService,
  betaTesters: ReadonlyArray<FiscalCode>,
  canaryTestUserRegex: NonEmptyString,
  ff: FeatureFlag
) => NotificationServiceFactory = (
  oldNotificationService,
  newNotificationService,
  betaTesters,
  canaryTestUserRegex,
  ff
) => {
  const isUserACanaryTestUser = getIsUserACanaryTestUser(canaryTestUserRegex);

  const isUserEligible = getIsUserEligibleForNewFeature<FiscalCode>(
    cf => betaTesters.includes(cf),
    cf => isUserACanaryTestUser(toFiscalCodeHash(cf)),
    ff
  );

  return flow(
    isUserEligible,
    B.fold(
      () => oldNotificationService,
      () => newNotificationService
    )
  );
};
