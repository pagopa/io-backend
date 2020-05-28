/**
 * This controller handles the bonus requests from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import BonusService from "src/services/bonusService";
import { InstanceId } from "../../generated/io-bonus-api/InstanceId";
import { withUserFromRequest } from "../types/user";

export default class BonusController {
  constructor(private readonly bonusService: BonusService) {}

  /**
   * Starts a request for a bonus for the current user.
   * Returns either an error or a reference to the request
   *
   */
  public readonly startBonusEligibilityCheck = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorValidation
    | IResponseErrorConflict
    | IResponseErrorInternal
    | IResponseSuccessJson<InstanceId>
  > =>
    withUserFromRequest(req, user =>
      this.bonusService.startBonusEligibilityCheck(user)
    );
}
