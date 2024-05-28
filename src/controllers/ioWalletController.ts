/**
 * This controller handles the IO_WALLET requests from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { sequenceS } from "fp-ts/lib/Apply";

import {
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  IResponseSuccessNoContent,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";

import { pipe } from "fp-ts/lib/function";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { UserDetailView } from "../../generated/io-wallet-api/UserDetailView";
import IoWalletService from "../services/ioWalletService";

import { NonceDetailView } from "../../generated/io-wallet-api/NonceDetailView";
import { withUserFromRequest } from "../types/user";
import { CreateWalletInstanceBody } from "../../generated/io-wallet-api/CreateWalletInstanceBody";
import { CreateWalletAttestationBody } from "../../generated/io-wallet-api/CreateWalletAttestationBody";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";

const toErrorRetrievingTheUserId = ResponseErrorInternal(
  "Error retrieving the user id"
);

export const retrieveUserId = (
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
          userId: pipe(
            retrieveUserId(this.ioWalletService, user.fiscal_code),
            TE.mapLeft(() => toErrorRetrievingTheUserId),
            TE.map((response) => response.value.id)
          ),
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
          userId: pipe(
            retrieveUserId(this.ioWalletService, user.fiscal_code),
            TE.mapLeft(() => toErrorRetrievingTheUserId),
            TE.map((response) => response.value.id)
          ),
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
}
