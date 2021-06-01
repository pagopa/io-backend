import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import { Certificate } from "@pagopa/io-functions-eucovidcerts-sdk/Certificate";
import { EUCovidCertAPIClient } from "../clients/eucovidcert.client";

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
    auth_code: string
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
          fiscal_code: user.fiscal_code
        }
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 400:
            return ResponseErrorUnexpectedAuthProblem();
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
