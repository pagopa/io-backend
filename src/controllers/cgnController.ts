/**
 * This controller handles the CGN requests from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { CgnStatus } from "generated/io-cgn-api/CgnStatus";
import CgnService from "src/services/cgnService";
import { withUserFromRequest } from "../types/user";

export default class CgnController {
  constructor(private readonly cgnService: CgnService) {}

  /**
   * Get the Cgn status for the current user.
   */
  public readonly getCgnStatus = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<CgnStatus>
  > => withUserFromRequest(req, user => this.cgnService.getCgnStatus(user));
}
