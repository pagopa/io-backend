/**
 * This controller handles the IO_WALLET requests from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

import {
  getResponseErrorForbiddenNotAuthorized,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorServiceUnavailable,
  IResponseErrorValidation,
  IResponseSuccessJson,
  IResponseSuccessNoContent,
  ResponseErrorValidation,
} from "@pagopa/ts-commons/lib/responses";

import { pipe } from "fp-ts/lib/function";
import { Errors } from "io-ts";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import IoWalletService from "../services/ioWalletService";

import { NonceDetailView } from "../../generated/io-wallet-api/NonceDetailView";
import { withUserFromRequest } from "../types/user";
import { CreateWalletInstanceBody } from "../../generated/io-wallet-api/CreateWalletInstanceBody";
import { CreateWalletAttestationBody } from "../../generated/io-wallet-api/CreateWalletAttestationBody";
import { WalletAttestationView } from "../../generated/io-wallet-api/WalletAttestationView";
import { FF_IO_WALLET_TRIAL_ENABLED } from "../config";
import { SetCurrentWalletInstanceStatusBody } from "../../generated/io-wallet/SetCurrentWalletInstanceStatusBody";

const toValidationError = (errors: Errors) =>
  ResponseErrorValidation(
    "Bad request",
    `Error validating the request body: ${readableReport(errors)}`
  );

export default class IoWalletController {
  constructor(private readonly ioWalletService: IoWalletService) {}

  /**
   * Get nonce
   */
  public readonly getNonce = (): Promise<
    | IResponseErrorInternal
    | IResponseSuccessJson<NonceDetailView>
    | IResponseErrorServiceUnavailable
  > => this.ioWalletService.getNonce();

  /**
   * Create a Wallet Instance
   */
  public readonly createWalletInstance = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorGeneric
    | IResponseErrorValidation
    | IResponseSuccessNoContent
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorServiceUnavailable
  > =>
    withUserFromRequest(req, async (user) =>
      pipe(
        this.ensureFiscalCodeIsAllowed(user.fiscal_code),
        TE.chainW(() =>
          pipe(
            req.body,
            CreateWalletInstanceBody.decode,
            E.mapLeft(toValidationError),
            TE.fromEither
          )
        ),
        TE.map(({ challenge, key_attestation, hardware_key_tag }) =>
          this.ioWalletService.createWalletInstance(
            challenge,
            hardware_key_tag,
            key_attestation,
            user.fiscal_code
          )
        ),
        TE.toUnion
      )()
    );

  /**
   * Create a Wallet Attestation
   */
  public readonly createWalletAttestation = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorGeneric
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<WalletAttestationView>
    | IResponseErrorNotFound
    | IResponseErrorServiceUnavailable
  > =>
    withUserFromRequest(req, async (user) =>
      pipe(
        this.ensureFiscalCodeIsAllowed(user.fiscal_code),
        TE.chainW(() =>
          pipe(
            req.body,
            CreateWalletAttestationBody.decode,
            E.mapLeft(toValidationError),
            TE.fromEither
          )
        ),
        TE.map(({ grant_type, assertion }) =>
          this.ioWalletService.createWalletAttestation(
            assertion,
            grant_type,
            user.fiscal_code
          )
        ),
        TE.toUnion
      )()
    );

  /**
   * Update current Wallet Instance status.
   */
  public readonly setCurrentWalletInstanceStatus = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorGeneric
    | IResponseSuccessNoContent
    | IResponseErrorServiceUnavailable
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
  > =>
    withUserFromRequest(req, async (user) =>
      pipe(
        this.ensureFiscalCodeIsAllowed(user.fiscal_code),
        TE.chainW(() =>
          pipe(
            req.body,
            SetCurrentWalletInstanceStatusBody.decode,
            E.mapLeft(toValidationError),
            TE.fromEither
          )
        ),
        TE.map(({ status }) =>
          this.ioWalletService.setCurrentWalletInstanceStatus(
            status,
            user.fiscal_code
          )
        ),
        TE.toUnion
      )()
    );

  private readonly ensureUserIsAllowed = (
    userId: NonEmptyString
  ): TE.TaskEither<Error, void> =>
    FF_IO_WALLET_TRIAL_ENABLED
      ? pipe(
          TE.tryCatch(
            () => this.ioWalletService.getSubscription(userId),
            E.toError
          ),
          // if a successful response with state != "ACTIVE" or an error is returned, return left
          TE.chain((response) =>
            response.kind === "IResponseSuccessJson" &&
            response.value.state === "ACTIVE"
              ? TE.right(undefined)
              : TE.left(new Error())
          )
        )
      : TE.right(undefined);

  private readonly ensureFiscalCodeIsAllowed = (fiscalCode: FiscalCode) =>
    pipe(
      fiscalCode,
      NonEmptyString.decode,
      TE.fromEither,
      TE.chainW(this.ensureUserIsAllowed),
      TE.mapLeft(() =>
        getResponseErrorForbiddenNotAuthorized(
          "Not authorized to perform this action"
        )
      )
    );
}
