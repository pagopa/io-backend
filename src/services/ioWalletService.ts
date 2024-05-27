/**
 * This service interacts with the IO Wallet API
 */

import {
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorGeneric,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";

import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { UserDetailView } from "generated/io-wallet-api/UserDetailView";
import {
  ResponseErrorStatusNotDefinedInSpec,
  withCatchAsInternalError,
  withValidatedOrInternalError,
} from "../utils/responses";
import { NonceDetailView } from "generated/io-wallet-api/NonceDetailView";
import { Id } from "generated/io-wallet-api/Id";
import { Grant_typeEnum } from "generated/io-wallet-api/CreateWalletAttestationBody";
import { IoWalletAPIClient } from "../clients/io-wallet";

const unprocessableContentError = "Unprocessable Content";
const invalidRequest = "Your request didn't validate";

export default class IoWalletService {
  constructor(
    private readonly ioWalletApiClient: ReturnType<IoWalletAPIClient>
  ) {}

  /**
   * Get the Wallet User id.
   */
  public readonly getUserByFiscalCode = (
    fiscalCode: FiscalCode
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorGeneric
    | IResponseSuccessJson<UserDetailView>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioWalletApiClient.getUserByFiscalCode({
        body: { fiscal_code: fiscalCode },
      });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
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
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Get a nonce.
   */
  public readonly getNonce = (): Promise<
    IResponseErrorInternal | IResponseSuccessJson<NonceDetailView>
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
    key_attestation: NonEmptyString,
    hardware_key_tag: NonEmptyString,
    userId: Id
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorGeneric
    | IResponseSuccessJson<undefined>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioWalletApiClient.createWalletInstance({
        body: {
          challenge,
          key_attestation,
          hardware_key_tag,
        },
        "x-iowallet-user-id": userId,
      });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 204:
            return ResponseSuccessJson(undefined);
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
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Create a Wallet Attestation.
   */
  public readonly createWalletAttestation = (
    grant_type: Grant_typeEnum,
    assertion: NonEmptyString,
    userId: Id
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorGeneric
    | IResponseSuccessJson<string>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioWalletApiClient.createWalletAttestation({
        body: {
          grant_type,
          assertion,
        },
        "x-iowallet-user-id": userId,
      });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 201:
            return ResponseSuccessJson(response.value);
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
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
