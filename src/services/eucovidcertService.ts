import {
  HttpStatusCodeEnum,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorGeneric,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";

import { Certificate } from "@pagopa/io-functions-eucovidcerts-sdk/Certificate";
import { PreferredLanguages } from "@pagopa/io-functions-eucovidcerts-sdk/PreferredLanguages";
import { readableProblem } from "../utils/errorsFormatter";
import { EUCovidCertAPIClient } from "../clients/eucovidcert.client";

import {
  ResponseErrorStatusNotDefinedInSpec,
  ResponseErrorUnexpectedAuthProblem,
  withCatchAsInternalError,
  withValidatedOrInternalError,
} from "../utils/responses";
import { User } from "../types/user";

/**
 * Returns a `504` `Gateway Timeout` error
 *
 * @param detail The error message
 */
export function ResponseGatewayTimeout(detail: string): IResponseErrorInternal {
  return {
    ...ResponseErrorGeneric(
      HttpStatusCodeEnum.HTTP_STATUS_504,
      "Gateway Timeout",
      detail
    ),
    kind: "IResponseErrorInternal",
  };
}

/**
 * Returns a `403` as `Not Found` error
 *
 * @param detail The error message
 */
export function ResponseErrorNotFound403(
  detail: string
): IResponseErrorNotFound {
  return {
    ...ResponseErrorGeneric(
      HttpStatusCodeEnum.HTTP_STATUS_403,
      "Not Found",
      detail
    ),
    kind: "IResponseErrorNotFound",
  };
}

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
          preferred_languages,
        },
      });

      return withValidatedOrInternalError(validated, (response) => {
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
            return ResponseErrorNotFound403(
              "Access data provided are invalid or no Certificate has been emitted for the given Citizen"
            );
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          case 504:
            return ResponseGatewayTimeout("DGC took to long to respond");
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
