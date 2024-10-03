/**
 * This controller handles the IO_WALLET requests from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { sequenceS } from "fp-ts/lib/Apply";

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
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";

import { flow, pipe } from "fp-ts/lib/function";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { UserDetailView } from "../../generated/io-wallet-api/UserDetailView";
import IoWalletService from "../services/ioWalletService";

import { NonceDetailView } from "../../generated/io-wallet-api/NonceDetailView";
import { withUserFromRequest } from "../types/user";
import { CreateWalletInstanceBody } from "../../generated/io-wallet-api/CreateWalletInstanceBody";
import { CreateWalletAttestationBody } from "../../generated/io-wallet-api/CreateWalletAttestationBody";
import { WalletAttestationView } from "../../generated/io-wallet-api/WalletAttestationView";
import { FF_IO_WALLET_TRIAL_ENABLED } from "../config";
import { SetCurrentWalletInstanceStatusBody } from "../../generated/io-wallet/SetCurrentWalletInstanceStatusBody";

const toErrorRetrievingTheUserId = ResponseErrorInternal(
  "Error retrieving the user id"
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
        sequenceS(TE.ApplyPar)({
          body: pipe(
            req.body,
            CreateWalletInstanceBody.decode,
            E.mapLeft((errors) =>
              ResponseErrorInternal(
                `Error validating the request body: ${readableReport(errors)}`
              )
            ),
            TE.fromEither
          ),
          userId: this.getAllowedUserId(user.fiscal_code),
        }),
        TE.map(
          ({
            body: { challenge, key_attestation, hardware_key_tag },
            userId,
          }) =>
            this.ioWalletService.createWalletInstance(
              challenge,
              hardware_key_tag,
              key_attestation,
              userId
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
        sequenceS(TE.ApplyPar)({
          body: pipe(
            req.body,
            CreateWalletAttestationBody.decode,
            E.mapLeft(() =>
              ResponseErrorInternal("Error validating the request body")
            ),
            TE.fromEither
          ),
          userId: this.getAllowedUserId(user.fiscal_code),
        }),
        TE.map(({ body: { grant_type, assertion }, userId }) =>
          this.ioWalletService.createWalletAttestation(
            assertion,
            grant_type,
            userId
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
        sequenceS(TE.ApplyPar)({
          body: pipe(
            req.body,
            SetCurrentWalletInstanceStatusBody.decode,
            E.mapLeft((errors) =>
              ResponseErrorInternal(
                `Error validating the request body: ${readableReport(errors)}`
              )
            ),
            TE.fromEither
          ),
          fiscalCode: this.ensureFiscalCodeIsAllowed(user.fiscal_code),
        }),
        TE.map(({ body: { status } }) =>
          this.ioWalletService.setCurrentWalletInstanceStatus(
            status,
            user.fiscal_code
          )
        ),
        TE.toUnion
      )()
    );

  private readonly retrieveUserId = (fiscalCode: FiscalCode) =>
    pipe(
      TE.tryCatch(
        () => this.ioWalletService.getUserByFiscalCode(fiscalCode),
        E.toError
      ),
      TE.chain(
        TE.fromPredicate(
          (r): r is IResponseSuccessJson<UserDetailView> =>
            r.kind === "IResponseSuccessJson",
          (e) =>
            new Error(
              `An error occurred while retrieving the User id. | ${e.detail}`
            )
        )
      )
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

  private readonly getAllowedUserId = (fiscalCode: FiscalCode) =>
    pipe(
      fiscalCode,
      NonEmptyString.decode,
      TE.fromEither,
      TE.chainW(this.ensureUserIsAllowed),
      TE.mapLeft(() =>
        getResponseErrorForbiddenNotAuthorized(
          "Not authorized to perform this action"
        )
      ),
      TE.chainW(() =>
        pipe(
          this.retrieveUserId(fiscalCode),
          TE.mapLeft(() => toErrorRetrievingTheUserId)
        )
      ),
      TE.map((response) => response.value.id)
    );

  // TODO SIW-1706
  private readonly ensureFiscalCodeIsAllowed: (
    fiscalCode: FiscalCode
  ) => TE.TaskEither<
    IResponseErrorInternal | IResponseErrorForbiddenNotAuthorized,
    void
  > = flow(
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
