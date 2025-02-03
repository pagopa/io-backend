import { Certificate } from "@pagopa/io-functions-eucovidcerts-sdk/Certificate";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import { GetCertificateParams } from "../../generated/eucovidcert/GetCertificateParams";
import { PreferredLanguages } from "../../generated/eucovidcert/PreferredLanguages";
import EUCovidService from "../services/eucovidcertService";
import { withUserFromRequest } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";

export const withGetCertificateParams = async <T>(
  req: express.Request,
  f: (auth_code: string, preferred_languages?: PreferredLanguages) => Promise<T>
) =>
  withValidatedOrValidationError(
    GetCertificateParams.decode(req.body.accessData),
    (val) => f(val.auth_code, val.preferred_languages)
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
    withUserFromRequest(req, (user) =>
      withGetCertificateParams(req, (auth_code, preferred_languages) =>
        this.eucovidCertService.getEUCovidCertificate(
          user,
          auth_code,
          preferred_languages
        )
      )
    );
}
