/**
 * This controller handles the CGN requests from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  IResponseSuccessRedirectToResource
} from "italia-ts-commons/lib/responses";

import { CgnStatus } from "generated/cgn/CgnStatus";
import CgnService from "src/services/cgnService";
import { InstanceId } from "generated/cgn/InstanceId";
import { CgnActivationDetail } from "generated/cgn/CgnActivationDetail";
import { withUserFromRequest } from "../types/user";

export default class CgnController {
  constructor(private readonly cgnService: CgnService) {}

  /**
   * Get the Cgn status for the current user.
   */
  public readonly getCgnStatus = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<CgnStatus>
  > => withUserFromRequest(req, user => this.cgnService.getCgnStatus(user));

  /**
   * Start a Cgn activation for the current user.
   */
  public readonly startCgnActivation = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorConflict
    | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
    | IResponseSuccessAccepted
  > =>
    withUserFromRequest(req, user => this.cgnService.startCgnActivation(user));

  /**
   * Cget Cgn activation's proces status for the current user.
   */
  public readonly getCgnActivation = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<CgnActivationDetail>
  > => withUserFromRequest(req, user => this.cgnService.getCgnActivation(user));
}
