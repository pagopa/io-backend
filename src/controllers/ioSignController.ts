/**
 * This controller handles the IO_SIGN requests from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { sequenceS } from "fp-ts/lib/Apply";

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  IResponseSuccessRedirectToResource,
  ResponseErrorInternal,
  ResponseErrorValidation
} from "@pagopa/ts-commons/lib/responses";

import IoSignService from "src/services/ioSignService";
import { pipe } from "fp-ts/lib/function";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { QtspClausesMetadataDetailView } from "generated/io-sign/QtspClausesMetadataDetailView";
import { SignatureRequestDetailView } from "generated/io-sign-api/SignatureRequestDetailView";
import { Id } from "generated/io-sign-api/Id";
import { SignerDetailView } from "../../generated/io-sign-api/SignerDetailView";

import { FilledDocumentDetailView } from "../../generated/io-sign/FilledDocumentDetailView";

import { CreateFilledDocument } from "../../generated/io-sign/CreateFilledDocument";

import { withUserFromRequest } from "../types/user";
import ProfileService from "../services/profileService";

import { profileWithEmailValidatedOrError } from "../utils/profile";

export const retrieveSignerId = (
  ioSignService: IoSignService,
  fiscalCode: FiscalCode
) =>
  pipe(
    TE.tryCatch(
      () => ioSignService.getSignerByFiscalCode(fiscalCode),
      E.toError
    ),
    TE.chain(
      TE.fromPredicate(
        (r): r is IResponseSuccessJson<SignerDetailView> =>
          r.kind === "IResponseSuccessJson",
        e =>
          e.kind === "IResponseErrorNotFound"
            ? new Error(
                `Your profile is not enabled to use this service. | ${e.detail}`
              )
            : new Error(
                `An error occurred while retrieving the signer id. | ${e.detail}`
              )
      )
    )
  );

const toErrorRetrievingTheSignerId = (e: Error) =>
  ResponseErrorInternal(
    `Error retrieving the signer id for this user | ${e.message}`
  );

export default class IoSignController {
  constructor(
    private readonly ioSignService: IoSignService,
    private readonly profileService: ProfileService
  ) {}

  /**
   * Given the url of a PDF document with empty fields,
   * fill in the PDF form and return the url of the filled document.
   */
  public readonly createFilledDocument = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessRedirectToResource<
        FilledDocumentDetailView,
        FilledDocumentDetailView
      >
  > =>
    withUserFromRequest(req, async user =>
      pipe(
        req.body,
        CreateFilledDocument.decode,
        E.mapLeft(errs =>
          ResponseErrorValidation(
            "Bad request",
            errorsToReadableMessages(errs).join(" / ")
          )
        ),
        TE.fromEither,
        TE.chainW(body =>
          pipe(
            sequenceS(TE.ApplySeq)({
              signerId: pipe(
                retrieveSignerId(this.ioSignService, user.fiscal_code),
                TE.mapLeft(toErrorRetrievingTheSignerId)
              ),
              userProfile: pipe(
                profileWithEmailValidatedOrError(this.profileService, user),
                TE.mapLeft(e =>
                  ResponseErrorInternal(
                    `Error retrieving a user profile with validated email address | ${e.message}`
                  )
                )
              )
            }),

            TE.map(({ userProfile, signerId }) =>
              this.ioSignService.createFilledDocument(
                body.document_url,
                userProfile.email,
                user.family_name as NonEmptyString,
                user.name as NonEmptyString,
                signerId.value.id
              )
            )
          )
        ),
        TE.toUnion
      )()
    );

  public readonly getQtspClausesMetadata = (): Promise<
    IResponseErrorInternal | IResponseSuccessJson<QtspClausesMetadataDetailView>
  > => this.ioSignService.getQtspClausesMetadata();

  public readonly getSignatureRequest = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseSuccessJson<SignatureRequestDetailView>
  > =>
    withUserFromRequest(req, async user =>
      pipe(
        sequenceS(TE.ApplyPar)({
          signatureRequestId: pipe(
            req.params.id,
            Id.decode,
            TE.fromEither,
            TE.mapLeft(_ =>
              ResponseErrorInternal(`Error validating the signature request id`)
            )
          ),
          signerId: pipe(
            retrieveSignerId(this.ioSignService, user.fiscal_code),
            TE.mapLeft(toErrorRetrievingTheSignerId),
            TE.map(response => response.value.id)
          )
        }),
        TE.map(({ signerId, signatureRequestId: id }) =>
          this.ioSignService.getSignatureRequest(id, signerId)
        ),
        TE.toUnion
      )()
    );
}
