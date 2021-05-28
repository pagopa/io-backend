import * as express from "express";

import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import { Certificate } from "../../generated/eucovidcert-api/Certificate";
import { GetCertificateParams } from "../../generated/eucovidcert/GetCertificateParams";
import { withValidatedOrValidationError } from "../utils/responses";
import EUCovidService from "../services/eucovidcertService";
import { withUserFromRequest } from "../types/user";

export const withAuthCode = async <T>(
  req: express.Request,
  f: (auth_code: string) => Promise<T>
) =>
  withValidatedOrValidationError(
    GetCertificateParams.decode(req.body.accessData),
    val => f(val.auth_code)
  );

export default class EUCovidCertController {
  constructor(private readonly eucovidCertService: EUCovidService) {}

  /**
   * Get the EU Covid Certificate for the current user.
   */
  public readonly getEUCovidCertificate = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<Certificate>
  > =>
    withUserFromRequest(req, user =>
      withAuthCode(req, auth_code =>
        this.eucovidCertService.getEUCovidCertificate(user, auth_code)
      )
    );
}
