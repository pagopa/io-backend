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
  IResponse,
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  IResponseSuccessNoContent,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";

import { pipe } from "fp-ts/lib/function";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { UserDetailView } from "../../generated/io-wallet-api/UserDetailView";
import IoWalletService from "../services/ioWalletService";

import { NonceDetailView } from "../../generated/io-wallet-api/NonceDetailView";
import { withUserFromRequest } from "../types/user";
import { CreateWalletInstanceBody } from "../../generated/io-wallet-api/CreateWalletInstanceBody";
import { CreateWalletAttestationBody } from "../../generated/io-wallet-api/CreateWalletAttestationBody";
import { Subscription } from "../../generated/trial-system-api/Subscription";
import { withValidatedOrValidationError } from "../utils/responses";
import { FF_IO_WALLET_TRIAL_ENABLED } from "../config";

const toErrorRetrievingTheUserId = ResponseErrorInternal(
  "Error retrieving the user id"
);

const ensureUserIsAllowed = (
  ioWalletService: IoWalletService,
  userId: NonEmptyString
): TE.TaskEither<Error, void> =>
  FF_IO_WALLET_TRIAL_ENABLED
    ? pipe(
        TE.tryCatch(() => ioWalletService.getSubscription(userId), E.toError),
        // if a successful response with state != "ACTIVE" or an error is returned, return left
        TE.chain((response) =>
          response.kind === "IResponseSuccessJson" &&
          response.value.state === "ACTIVE"
            ? TE.right(undefined)
            : TE.left(new Error())
        )
      )
    : TE.right(undefined);

const retrieveUserId = (
  ioWalletService: IoWalletService,
  fiscalCode: FiscalCode
) =>
  pipe(
    TE.tryCatch(
      () => ioWalletService.getUserByFiscalCode(fiscalCode),
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

export default class IoWalletController {
  constructor(private readonly ioWalletService: IoWalletService) {}

  /**
   * Get nonce
   */
  public readonly getNonce = (): Promise<
    IResponseErrorInternal | IResponseSuccessJson<NonceDetailView>
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
    | IResponse<"IResponseErrorForbiddenNotAuthorized">
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
    | IResponse<"IResponseErrorForbiddenNotAuthorized">
    | IResponseSuccessJson<string>
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
   * Get the subscription given a specific user.
   */
  public readonly getTrialSubscription = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<Pick<Subscription, "state" | "createdAt">>
  > =>
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        NonEmptyString.decode(user.fiscal_code),
        (userId) => this.ioWalletService.getSubscription(userId)
      )
    );

  private readonly getAllowedUserId = (fiscalCode: FiscalCode) =>
    pipe(
      fiscalCode,
      NonEmptyString.decode,
      TE.fromEither,
      TE.chainW((fiscalCode) =>
        ensureUserIsAllowed(this.ioWalletService, fiscalCode)
      ),
      TE.mapLeft(() =>
        getResponseErrorForbiddenNotAuthorized(
          "Not authorized to perform this action"
        )
      ),
      TE.chainW(() =>
        pipe(
          retrieveUserId(this.ioWalletService, fiscalCode),
          TE.mapLeft(() => toErrorRetrievingTheUserId)
        )
      ),
      TE.map((response) => response.value.id)
    );
}
