/**
 * This controller handles reading/upserting the user data processing from the
 * app by forwarding the call to the API system.
 */

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import { CitizenStatus } from "generated/cdc-support-platform/CitizenStatus";
import CdcSupportService from "src/services/cdcSupportService";

import { withUserFromRequest } from "../types/user";

export default class CdcSupportController {
  constructor(private readonly cdcSupportService: CdcSupportService) {}

  /**
   * Get the status of the citizen in CDC system
   */
  public readonly status = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<CitizenStatus>
  > =>
    withUserFromRequest(req, async (user) =>
      this.cdcSupportService.status(user.fiscal_code)
    );
}
