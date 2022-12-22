import * as B from "fp-ts/boolean";
import { flow } from "fp-ts/lib/function";

import { FiscalCode } from "../../generated/io-bonus-api/FiscalCode";
import {
  FeatureFlag,
  getIsUserEligibleForNewFeature
} from "../utils/featureFlag";
import NotificationService from "./notificationService";

export type NotificationServiceFactory = (
  fiscalCode: FiscalCode
) => NotificationService;

export const getNotificationServiceFactory: (
  oldNotificationService: NotificationService,
  newNotificationService: NotificationService,
  betaTesters: ReadonlyArray<FiscalCode>,
  ff: FeatureFlag
) => NotificationServiceFactory = (
  oldNotificationService,
  newNotificationService,
  betaTesters,
  ff
) => {
  const isUserEligible = getIsUserEligibleForNewFeature<FiscalCode>(
    cf => betaTesters.includes(cf),
    _ => false,
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
