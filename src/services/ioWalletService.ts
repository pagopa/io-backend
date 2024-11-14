/* eslint-disable sonarjs/no-identical-functions */
/**
 * This service interacts with the IO Wallet API
 */

import {
  getResponseErrorForbiddenNotAuthorized,
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
} from "@pagopa/ts-commons/lib/responses";

import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { NonceDetailView } from "generated/io-wallet-api/NonceDetailView";
import { Grant_typeEnum } from "generated/io-wallet-api/CreateWalletAttestationBody";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import { IoWalletAPIClient } from "../clients/io-wallet";
import {
  ResponseErrorStatusNotDefinedInSpec,
  withCatchAsInternalError,
  withValidatedOrInternalError,
} from "../utils/responses";
import { IO_WALLET_TRIAL_ID } from "../config";
import { TrialSystemAPIClient } from "../clients/trial-system.client";
import { Subscription } from "../../generated/trial-system-api/Subscription";
import { WalletAttestationView } from "../../generated/io-wallet-api/WalletAttestationView";
import { SetWalletInstanceStatusWithFiscalCodeData } from "../../generated/io-wallet-api/SetWalletInstanceStatusWithFiscalCodeData";
import { WalletData } from "../../generated/io-wallet-api/WalletData";

const unprocessableContentError = "Unprocessable Content";
const invalidRequest = "Your request didn't validate";

// TODO SIW-1482
const conflictErrorTitle = "Conflict";
const conflictErrorDetail = "There has been a conflict";

const serviceUnavailableDetail = "Service Unavailable. Please try again later";

export default class IoWalletService {
  constructor(
    private readonly ioWalletApiClient: ReturnType<IoWalletAPIClient>,
    private readonly trialSystemApiClient: ReturnType<
      typeof TrialSystemAPIClient
    >
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
          key_attestation,
        },
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

  /**
   * Create a Wallet Attestation.
   */
  public readonly createWalletAttestation = (
    assertion: NonEmptyString,
    grant_type: Grant_typeEnum,
    fiscal_code: FiscalCode
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorGeneric
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseSuccessJson<WalletAttestationView>
    | IResponseErrorServiceUnavailable
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioWalletApiClient.createWalletAttestation({
        body: {
          assertion,
          fiscal_code,
          grant_type,
        },
      });
      return withValidatedOrInternalError(validated, (response) => {
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
    });

  /**
   * Update current Wallet Instance status.
   */
  public readonly setCurrentWalletInstanceStatus = (
    status: SetWalletInstanceStatusWithFiscalCodeData["status"],
    fiscal_code: SetWalletInstanceStatusWithFiscalCodeData["fiscal_code"]
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorGeneric
    | IResponseSuccessNoContent
    | IResponseErrorServiceUnavailable
  > =>
    withCatchAsInternalError(async () => {
      const validated =
        await this.ioWalletApiClient.setCurrentWalletInstanceStatus({
          body: { fiscal_code, status },
        });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 204:
            return ResponseSuccessNoContent();
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

  /**
   * Get current Wallet Instance status.
   */
  public readonly getCurrentWalletInstanceStatus = (
    fiscal_code: FiscalCode
  ): Promise<
    | IResponseSuccessJson<WalletData>
    | IResponseErrorNotFound
    | IResponseErrorInternal
    | IResponseErrorServiceUnavailable
  > =>
    withCatchAsInternalError(async () => {
      const validated =
        await this.ioWalletApiClient.getCurrentWalletInstanceStatus({
          "fiscal-code": fiscal_code,
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
   * Get the subscription given a specific user.
   */
  public readonly getSubscription = async (
    userId: NonEmptyString
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<Pick<Subscription, "state" | "createdAt">>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.trialSystemApiClient.getSubscription({
        trialId: IO_WALLET_TRIAL_ID,
        userId,
      });

      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 200:
            return pipe(
              {
                createdAt: response.value.createdAt,
                state: response.value.state,
              },
              ResponseSuccessJson
            );
          case 401:
            return ResponseErrorInternal("Internal server error");
          case 404:
            return ResponseErrorNotFound("Not Found", "Subscription not found");
          case 500:
            return ResponseErrorInternal(
              pipe(
                response.value.detail,
                O.fromNullable,
                O.getOrElse(() => "Cannot get subscription")
              )
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
