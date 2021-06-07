import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import { EUCovidCertAPIClient } from "../clients/eucovidcert.client";
import { Certificate } from "../../generated/eucovidcert-api/Certificate";
import { PreferredLanguages } from "../../generated/eucovidcert-api/PreferredLanguages";

import {
  ResponseErrorStatusNotDefinedInSpec,
  ResponseErrorUnexpectedAuthProblem,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";
import { User } from "../types/user";

export default class EUCovidCertService {
  constructor(
    private readonly eucovidCertApiClient: ReturnType<EUCovidCertAPIClient>
  ) {}

  /**
   * Get the EU Covid Certificte Status related to the user and auth_code
   */
  public readonly getEUCovidCertificate = (
    user: User,
    auth_code: string,
    preferred_languages?: PreferredLanguages
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<Certificate>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.eucovidCertApiClient.getCertificate({
        accessData: {
          auth_code,
          fiscal_code: user.fiscal_code,
          preferred_languages
        }
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 400:
            return ResponseErrorValidation(
              "Bad Request",
              "Payload has bad format"
            );
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 403:
            return ResponseErrorNotFound("Not Found", "Certificate not found");
          case 500:
            return ResponseErrorInternal("");
          case 504:
            return ResponseErrorInternal("");
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
