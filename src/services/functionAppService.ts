/**
 * This service retrieves messages from the API system using an API client.
 */

import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorConflict,
  ResponseErrorNotFound,
  ResponseErrorTooManyRequests,
  ResponseErrorValidation,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";

import * as E from "fp-ts/Either";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { APIClient } from "src/clients/api";
import { PromiseType } from "@pagopa/ts-commons/lib/types";
import { UpsertServicePreference } from "generated/backend/UpsertServicePreference";
import { ServiceId } from "@pagopa/io-functions-app-sdk/ServiceId";
import { PaginatedServiceTupleCollection } from "../../generated/backend/PaginatedServiceTupleCollection";
import { ServicePublic } from "../../generated/backend/ServicePublic";
import { ServicePreference } from "../../generated/backend/ServicePreference";

import {
  ResponseErrorStatusNotDefinedInSpec,
  ResponseErrorUnexpectedAuthProblem,
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError,
} from "../utils/responses";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

type RightOf<T extends E.Either<unknown, unknown>> = T extends E.Right<infer R>
  ? R
  : never;

const handleGetServicePreferencesResponse = (
  response: RightOf<
    PromiseType<ReturnType<ReturnType<APIClient>["getServicePreferences"]>>
  >
) => {
  switch (response.status) {
    case 200:
      return ResponseSuccessJson(response.value);
    case 400:
      return ResponseErrorValidation("Bad Request", "Payload has bad format");
    case 401:
      return ResponseErrorUnexpectedAuthProblem();
    case 404:
      return ResponseErrorNotFound("Not Found", "User or Service not found");
    case 409:
      return ResponseErrorConflict(
        response.value.detail ??
          "The Profile is not in the correct preference mode"
      );
    case 429:
      return ResponseErrorTooManyRequests();
    default:
      return ResponseErrorStatusNotDefinedInSpec(response);
  }
};

// ----------------------

export default class FunctionsAppService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieve all the information about the service that has sent a message.
   */
  public readonly getService = (
    serviceId: string
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ServicePublic>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const validated = await client.getService({
        service_id: serviceId,
      });

      return withValidatedOrInternalError(validated, (response) =>
        response.status === 200
          ? withValidatedOrInternalError(
              ServicePublic.decode(response.value),
              ResponseSuccessJson
            )
          : response.status === 404
          ? ResponseErrorNotFound("Not found", "Service not found")
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : unhandledResponseStatus(response.status)
      );
    });

  /**
   * Retrieve the service preferences fot the defined user and service
   */
  public readonly getServicePreferences = (
    fiscalCode: FiscalCode,
    serviceId: ServiceId
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseErrorConflict
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ServicePreference>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const validated = await client.getServicePreferences({
        fiscal_code: fiscalCode,
        service_id: serviceId,
      });

      return withValidatedOrInternalError(
        validated,
        handleGetServicePreferencesResponse
      );
    });

  /**
   * Retrieve the service preferences fot the defined user and service
   */
  public readonly upsertServicePreferences = (
    fiscalCode: FiscalCode,
    serviceId: ServiceId,
    servicePreferences: UpsertServicePreference
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseErrorConflict
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ServicePreference>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const validated = await client.upsertServicePreferences({
        body: servicePreferences,
        fiscal_code: fiscalCode,
        service_id: serviceId,
      });

      return withValidatedOrInternalError(
        validated,
        handleGetServicePreferencesResponse
      );
    });

  public readonly getVisibleServices = (): Promise<
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<PaginatedServiceTupleCollection>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const validated = await client.getVisibleServices({});

      return withValidatedOrInternalError(validated, (response) =>
        response.status === 200
          ? withValidatedOrInternalError(
              PaginatedServiceTupleCollection.decode(response.value),
              ResponseSuccessJson
            )
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : unhandledResponseStatus(response.status)
      );
    });
}
