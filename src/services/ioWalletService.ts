/**
 * This service interacts with the IO Wallet API
 */

import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorServiceUnavailable,
  IResponseSuccessJson,
  IResponseSuccessNoContent,
  ResponseErrorGeneric,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorServiceTemporarilyUnavailable,
  ResponseSuccessJson,
  ResponseSuccessNoContent,
  getResponseErrorForbiddenNotAuthorized
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { NonceDetailView } from "generated/io-wallet-api/NonceDetailView";
import { WalletAttestationsView } from "generated/io-wallet-api/WalletAttestationsView";
import { WhitelistedFiscalCodeData } from "generated/io-wallet-api/WhitelistedFiscalCodeData";
import * as t from "io-ts";

import { SetWalletInstanceStatusWithFiscalCodeData } from "../../generated/io-wallet-api/SetWalletInstanceStatusWithFiscalCodeData";
import { WalletInstanceData } from "../../generated/io-wallet-api/WalletInstanceData";
import { IoWalletAPIClient } from "../clients/io-wallet";
import {
  ResponseErrorStatusNotDefinedInSpec,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";

const unprocessableContentError = "Unprocessable Content";
const invalidRequest = "Your request didn't validate";

// TODO SIW-1482
const conflictErrorTitle = "Conflict";
const conflictErrorDetail = "There has been a conflict";

const serviceUnavailableDetail = "Service Unavailable. Please try again later";

type ValidatedResponse<T> = t.Validation<
  | IResponseType<409, undefined, never>
  | IResponseType<422, undefined, never>
  | IResponseType<500, undefined, never>
  | IResponseType<403, undefined, never>
  | IResponseType<404, undefined, never>
  | IResponseType<503, undefined, never>
  | IResponseType<200, T, never>
>;

export default class IoWalletService {
  constructor(
    private readonly ioWalletApiClient: ReturnType<IoWalletAPIClient>
  ) {}

  /**
   * Get a nonce.
   */
  public readonly getNonce = (): Promise<
    | IResponseErrorInternal
    | IResponseSuccessJson<NonceDetailView>
    | IResponseErrorServiceUnavailable
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioWalletApiClient.getNonce({});
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 500:
            return ResponseErrorInternal(
              `Internal server error | ${response.value}`
            );
          case 503:
            return ResponseErrorServiceTemporarilyUnavailable(
              serviceUnavailableDetail,
              "10"
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Create a Wallet Instance.
   */
  public readonly createWalletInstance = (
    challenge: NonEmptyString,
    hardware_key_tag: NonEmptyString,
    key_attestation: NonEmptyString,
    fiscal_code: FiscalCode
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorGeneric
    | IResponseSuccessNoContent
    | IResponseErrorServiceUnavailable
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioWalletApiClient.createWalletInstance({
        body: {
          challenge,
          fiscal_code,
          hardware_key_tag,
          key_attestation
        }
      });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 204:
            return ResponseSuccessNoContent();
          case 409:
            return ResponseErrorGeneric(
              response.status,
              conflictErrorTitle,
              conflictErrorDetail
            );
          case 422:
            return ResponseErrorGeneric(
              response.status,
              unprocessableContentError,
              invalidRequest
            );
          case 500:
            return ResponseErrorInternal(
              `Internal server error | ${response.value}`
            );
          case 503:
            return ResponseErrorServiceTemporarilyUnavailable(
              serviceUnavailableDetail,
              "10"
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  mapWalletAttestationApiResponse = <T>(
    validatedResponse: ValidatedResponse<T>
  ):
    | IResponseErrorInternal
    | IResponseErrorGeneric
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseSuccessJson<T>
    | IResponseErrorServiceUnavailable =>
    withValidatedOrInternalError(validatedResponse, (response) => {
      switch (response.status) {
        case 200:
          return ResponseSuccessJson(response.value);
        case 403:
          return getResponseErrorForbiddenNotAuthorized(
            "Wallet instance has been revoked"
          );
        case 404:
          return ResponseErrorNotFound(
            "Not Found",
            "Wallet instance not found"
          );
        case 409:
          return ResponseErrorGeneric(
            response.status,
            conflictErrorTitle,
            conflictErrorDetail
          );
        case 422:
          return ResponseErrorGeneric(
            response.status,
            unprocessableContentError,
            invalidRequest
          );
        case 500:
          return ResponseErrorInternal(
            `Internal server error | ${response.value}`
          );
        case 503:
          return ResponseErrorServiceTemporarilyUnavailable(
            serviceUnavailableDetail,
            "10"
          );
        default:
          return ResponseErrorStatusNotDefinedInSpec(response);
      }
    });

  /**
   * Create a list of Wallet Attestations.
   */
  public readonly createWalletAttestation = (
    assertion: NonEmptyString,
    fiscal_code: FiscalCode
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorGeneric
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseSuccessJson<WalletAttestationsView>
    | IResponseErrorServiceUnavailable
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioWalletApiClient.createWalletAttestation({
        body: {
          assertion,
          fiscal_code
        }
      });
      return this.mapWalletAttestationApiResponse<WalletAttestationsView>(
        validated
      );
    });

  /**
   * Update current Wallet Instance status.
   */
  public readonly setWalletInstanceStatus = (
    id: NonEmptyString,
    status: SetWalletInstanceStatusWithFiscalCodeData["status"],
    fiscal_code: SetWalletInstanceStatusWithFiscalCodeData["fiscal_code"]
  ): Promise<
    | IResponseErrorInternal
    | IResponseSuccessNoContent
    | IResponseErrorServiceUnavailable
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioWalletApiClient.setWalletInstanceStatus({
        body: { fiscal_code, status },
        id
      });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 204:
            return ResponseSuccessNoContent();
          case 400:
          case 422:
          case 500:
            return ResponseErrorInternal(
              `Internal server error | ${response.value}`
            );
          case 503:
            return ResponseErrorServiceTemporarilyUnavailable(
              serviceUnavailableDetail,
              "10"
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Get current Wallet Instance status.
   */
  public readonly getWalletInstanceStatus = (
    id: NonEmptyString,
    fiscal_code: FiscalCode
  ): Promise<
    | IResponseSuccessJson<WalletInstanceData>
    | IResponseErrorNotFound
    | IResponseErrorInternal
    | IResponseErrorServiceUnavailable
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioWalletApiClient.getWalletInstanceStatus({
        "fiscal-code": fiscal_code,
        id
      });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 404:
            return ResponseErrorNotFound(
              "Not Found",
              "Wallet instance not found"
            );
          case 400:
          case 422:
          case 500:
            return ResponseErrorInternal(
              `Internal server error | ${response.value}`
            );
          case 503:
            return ResponseErrorServiceTemporarilyUnavailable(
              serviceUnavailableDetail,
              "10"
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Get Current Wallet Instance Status
   */
  public readonly getCurrentWalletInstanceStatus = (
    fiscal_code: FiscalCode
  ): Promise<
    | IResponseSuccessJson<WalletInstanceData>
    | IResponseErrorNotFound
    | IResponseErrorInternal
    | IResponseErrorServiceUnavailable
  > =>
    withCatchAsInternalError(async () => {
      const validated =
        await this.ioWalletApiClient.getCurrentWalletInstanceStatus({
          "fiscal-code": fiscal_code
        });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 404:
            return ResponseErrorNotFound(
              "Not Found",
              "Wallet instance not found"
            );
          case 400:
          case 422:
          case 500:
            return ResponseErrorInternal(
              `Internal server error | ${response.value}`
            );
          case 503:
            return ResponseErrorServiceTemporarilyUnavailable(
              serviceUnavailableDetail,
              "10"
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Check if the fiscal code is whitelisted or not.
   */
  public readonly isFiscalCodeWhitelisted = (
    fiscalCode: FiscalCode
  ): Promise<
    | IResponseErrorInternal
    | IResponseSuccessJson<WhitelistedFiscalCodeData>
    | IResponseErrorServiceUnavailable
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioWalletApiClient.isFiscalCodeWhitelisted({
        fiscalCode
      });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 400:
          case 422:
          case 500:
            return ResponseErrorInternal(
              `Internal server error | ${response.value}`
            );
          case 503:
            return ResponseErrorServiceTemporarilyUnavailable(
              serviceUnavailableDetail,
              "10"
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Health check
   */
  public readonly healthCheck = (): Promise<
    IResponseErrorInternal | IResponseSuccessJson<undefined>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioWalletApiClient.healthCheck({});
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 500:
            return ResponseErrorInternal(
              `Internal server error | ${response.value}`
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
