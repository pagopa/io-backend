/**
 * This controller handles the IO_WALLET requests from the
 * app by forwarding the call to the API system.
 */

import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorServiceUnavailable,
  IResponseErrorValidation,
  IResponseSuccessJson,
  IResponseSuccessNoContent,
  ResponseErrorValidation,
  getResponseErrorForbiddenNotAuthorized
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { pipe } from "fp-ts/lib/function";
import { Errors } from "io-ts";

import { CreateWalletAttestationBody } from "../../generated/io-wallet/CreateWalletAttestationBody";
import { CreateWalletInstanceBody } from "../../generated/io-wallet/CreateWalletInstanceBody";
import { NonceDetailView } from "../../generated/io-wallet/NonceDetailView";
import { SetWalletInstanceStatusBody } from "../../generated/io-wallet/SetWalletInstanceStatusBody";
import { WalletAttestationView } from "../../generated/io-wallet/WalletAttestationView";
import { WalletInstanceData } from "../../generated/io-wallet/WalletInstanceData";
import { FF_IO_WALLET_TRIAL_ENABLED } from "../config";
import IoWalletService from "../services/ioWalletService";
import { withUserFromRequest } from "../types/user";

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
  public readonly setWalletInstanceStatus = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
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
            sequenceS(E.Apply)({
              body: pipe(
                req.body,
                SetWalletInstanceStatusBody.decode,
                E.mapLeft(toValidationError)
              ),
              id: pipe(
                NonEmptyString.decode(req.params.walletInstanceId),
                E.mapLeft(toValidationError)
              )
            }),
            TE.fromEither
          )
        ),
        TE.map(({ id, body: { status } }) =>
          this.ioWalletService.setWalletInstanceStatus(
            id,
            status,
            user.fiscal_code
          )
        ),
        TE.toUnion
      )()
    );

  /**
   * Get current Wallet Instance status.
   */
  public readonly getWalletInstanceStatus = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseSuccessJson<WalletInstanceData>
    | IResponseErrorNotFound
    | IResponseErrorServiceUnavailable
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
  > =>
    withUserFromRequest(req, async (user) =>
      pipe(
        this.ensureFiscalCodeIsAllowed(user.fiscal_code),
        TE.chainW(() =>
          pipe(
            NonEmptyString.decode(req.params.walletInstanceId),
            E.mapLeft(toValidationError),
            TE.fromEither
          )
        ),
        TE.map((walletInstanceId) =>
          this.ioWalletService.getWalletInstanceStatus(
            walletInstanceId,
            user.fiscal_code
          )
        ),
        TE.toUnion
      )()
    );

  /**
   * Get Current Wallet Instance Status
   */
  public readonly getCurrentWalletInstanceStatus = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseSuccessJson<WalletInstanceData>
    | IResponseErrorNotFound
    | IResponseErrorServiceUnavailable
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
  > =>
    withUserFromRequest(req, async (user) =>
      pipe(
        TE.right(undefined),
        TE.map(() =>
          this.ioWalletService.getCurrentWalletInstanceStatus(user.fiscal_code)
        ),
        TE.toUnion
      )()
    );

  private readonly ensureUserIsAllowed = (
    userId: NonEmptyString
  ): TE.TaskEither<Error, void> =>
    pipe(
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
    );

  private readonly ensureFiscalCodeIsAllowed = (fiscalCode: FiscalCode) =>
    FF_IO_WALLET_TRIAL_ENABLED
      ? pipe(
          fiscalCode,
          NonEmptyString.decode,
          TE.fromEither,
          TE.chainW(this.ensureUserIsAllowed),
          TE.mapLeft(() =>
            getResponseErrorForbiddenNotAuthorized(
              "Not authorized to perform this action"
            )
          )
        )
      : TE.right(undefined);
}
