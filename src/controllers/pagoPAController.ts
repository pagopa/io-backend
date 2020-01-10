/**
 * This controller handles requests made from the PagoPA backend.
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { PagoPAUser } from "../../generated/pagopa/PagoPAUser";
import { withUserFromRequest } from "../types/user";

export default class PagoPAController {
  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   */
  public readonly getUser = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseSuccessJson<PagoPAUser>
  > =>
    withUserFromRequest(req, async user =>
      PagoPAUser.decode({
        email: user.spid_email,
        family_name: user.family_name,
        mobile_phone: user.spid_mobile_phone,
        name: user.name
      }).fold<IResponseErrorValidation | IResponseSuccessJson<PagoPAUser>>(
        _ => ResponseErrorValidation("Validation Error", "Invalid User Data"),
        ResponseSuccessJson
      )
    );
}
