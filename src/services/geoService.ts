/**
 * This file contains methods for dealing with session tokens.
 */

import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponseErrorGeneric,
  HttpStatusCodeEnum,
  IResponseErrorGeneric,
  ResponseErrorNotFound,
  IResponseErrorNotFound
} from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { HereAPIClient } from "../../src/clients/here";
import { readableProblem } from "../../src/utils/errorsFormatter";
import {
  ResponseErrorStatusNotDefinedInSpec,
  withValidatedOrInternalError,
  withCatchAsInternalError
} from "../../src/utils/responses";
import { OpenSearchAutocompleteResponse } from "../../generated/api-here/OpenSearchAutocompleteResponse";
import { LookupResponse } from "../../generated/api-here/LookupResponse";
import { OpenSearchGeocodeResponse } from "../../generated/api-here/OpenSearchGeocodeResponse";
import { AutocompleteQueryParams } from "../../generated/geo/AutocompleteQueryParams";

export const DEFAULT_LANG = "it_IT";
export const DEFAULT_SEARCH_COUNTRIES = "countryCode:ITA";

const BAD_REQUEST_TITLE = "Bad Request";
const NOT_SUPPORTED_TITLE = "Not Supported";

export default class TokenService {
  constructor(
    private readonly hereGeocodeApiClient: ReturnType<HereAPIClient>,
    private readonly hereAutocompleteApiClient: ReturnType<HereAPIClient>,
    private readonly hereLookupApiClient: ReturnType<HereAPIClient>
  ) {}

  /**
   * Call Here's autocomplete API
   *
   * @param queryAddress: The query address typed by user
   * @param apiKey: The Here's API Platform API Key
   */
  public getAutocomplete(
    queryAddress: NonEmptyString,
    limit: AutocompleteQueryParams["limit"],
    apiKey: NonEmptyString
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorGeneric
    | IResponseSuccessJson<OpenSearchAutocompleteResponse>
  > {
    return withCatchAsInternalError(async () => {
      const validated = await this.hereAutocompleteApiClient.autocomplete({
        apiKey,
        in: DEFAULT_SEARCH_COUNTRIES,
        lang: DEFAULT_LANG,
        limit,
        q: queryAddress
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 400:
            return ResponseErrorValidation(
              BAD_REQUEST_TITLE,
              readableProblem(response.value)
            );
          case 405:
            return ResponseErrorGeneric(
              HttpStatusCodeEnum.HTTP_STATUS_405,
              NOT_SUPPORTED_TITLE,
              "Method not supported for Autocomplete API"
            );
          case 503:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
  }

  /**
   * Call Here's geocode API
   *
   * @param queryAddress: The query address typed by user
   * @param apiKey: The Here's API Platform API Key
   */
  public getGeocoding(
    queryAddress: NonEmptyString,
    apiKey: NonEmptyString
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorGeneric
    | IResponseSuccessJson<OpenSearchGeocodeResponse>
  > {
    return withCatchAsInternalError(async () => {
      const validated = await this.hereGeocodeApiClient.geocode({
        apiKey,
        in: DEFAULT_SEARCH_COUNTRIES,
        q: queryAddress
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 400:
            return ResponseErrorValidation(
              BAD_REQUEST_TITLE,
              readableProblem(response.value)
            );
          case 405:
            return ResponseErrorGeneric(
              HttpStatusCodeEnum.HTTP_STATUS_405,
              NOT_SUPPORTED_TITLE,
              "Method not supported for Geocode API"
            );
          case 503:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
  }

  /**
   * Call Here's lookup API
   *
   * @param id: The unique Here's place identifier
   * @param apiKey: The Here's API Platform API Key
   */
  public getLookup(
    id: NonEmptyString,
    apiKey: NonEmptyString
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorGeneric
    | IResponseSuccessJson<LookupResponse>
  > {
    return withCatchAsInternalError(async () => {
      const validated = await this.hereLookupApiClient.lookup({
        apiKey,
        id
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 400:
            return ResponseErrorValidation(
              BAD_REQUEST_TITLE,
              readableProblem(response.value)
            );
          case 404:
            return ResponseErrorNotFound("Not Found", "Lookup Id Not found");
          case 405:
            return ResponseErrorGeneric(
              HttpStatusCodeEnum.HTTP_STATUS_405,
              NOT_SUPPORTED_TITLE,
              "Method not supported for Lookup API"
            );
          case 503:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
  }
}
