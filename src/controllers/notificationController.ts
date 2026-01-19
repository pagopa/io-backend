/**
 * This controller handles webhook requests from the API backend.
 */

import {
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { Millisecond } from "@pagopa/ts-commons/lib/units";
import * as express from "express";
import { NotificationServiceFactory } from "src/services/notificationServiceFactory";

import { Installation } from "../../generated/backend/Installation";
import { InstallationID } from "../../generated/backend/InstallationID";
import { SuccessResponse } from "../../generated/notifications/SuccessResponse";
import { withUserFromRequest } from "../types/user";
import { log } from "../utils/logger";
import { withValidatedOrValidationError } from "../utils/responses";

const delay = (ms: Millisecond) => new Promise((ok) => setTimeout(ok, ms));

export interface INotificationControllerOptions {
  readonly notificationDefaultSubject: string;
  readonly notificationDefaultTitle: string;
}

export default class NotificationController {
  constructor(
    private readonly notificationServiceFactory: NotificationServiceFactory
  ) {}

  public async createOrUpdateInstallation(
    req: express.Request
  ): Promise<IResponseErrorValidation | IResponseSuccessJson<SuccessResponse>> {
    return withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(InstallationID.decode(req.params.id), () =>
        withValidatedOrValidationError(
          Installation.decode(req.body),
          (installation) => {
            // async fire & forget
            // On login, we do a deleteInstallation to prevent a device to be associated with a previous user, which might be a different one
            // We have empirical evidence that such deleteInstallation is processed after the createOrUpdateInstallation,
            //  so that the installation we are recording after login is lost
            // The correct order of execution must be enforced by the processing notifications service.
            // Anyway, to quickly mitigate the disservice to our users, we apply this temporary workaround
            delay(10000 as Millisecond)
              .then(() =>
                this.notificationServiceFactory(
                  user.fiscal_code
                ).createOrUpdateInstallation(user.fiscal_code, installation)
              )
              .catch((err) => {
                log.error(
                  "Cannot create installation: %s",
                  JSON.stringify(err)
                );
              });
            return ResponseSuccessJson({ message: "ok" });
          }
        )
      )
    );
  }
}
