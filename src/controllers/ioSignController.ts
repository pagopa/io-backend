/**
 * This controller handles the IO_SIGN requests from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as t from "io-ts";
import { sequenceS } from "fp-ts/lib/Apply";

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  IResponseSuccessRedirectToResource,
  ResponseErrorInternal,
  ResponseErrorValidation,
} from "@pagopa/ts-commons/lib/responses";

import { pipe } from "fp-ts/lib/function";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { Errors } from "io-ts";
import {
  withValidatedOrValidationError,
  withCatchAsInternalError,
} from "../utils/responses";
import {
  IssuerEnvironment,
  IssuerEnvironmentEnum,
} from "../../generated/io-sign/IssuerEnvironment";
import IoSignService from "../services/ioSignService";
import { ResLocals } from "../utils/express";
import { LollipopLocalsType, withLollipopLocals } from "../types/lollipop";
import { Id } from "../../generated/io-sign/Id";
import { QtspClausesMetadataDetailView } from "../../generated/io-sign/QtspClausesMetadataDetailView";
import { SignatureDetailView } from "../../generated/io-sign/SignatureDetailView";
import { SignatureRequestDetailView } from "../../generated/io-sign/SignatureRequestDetailView";
import { SignerDetailView } from "../../generated/io-sign-api/SignerDetailView";
import { SignatureRequestList } from "../../generated/io-sign-api/SignatureRequestList";
import { FilledDocumentDetailView } from "../../generated/io-sign/FilledDocumentDetailView";

import { CreateFilledDocument } from "../../generated/io-sign/CreateFilledDocument";
import { CreateSignatureBody } from "../../generated/io-sign/CreateSignatureBody";

import { withUserFromRequest } from "../types/user";
import ProfileService from "../services/profileService";

import { profileWithEmailValidatedOrError } from "../utils/profile";

const responseErrorValidation = (errs: Errors) =>
  ResponseErrorValidation(
    "Bad request",
    errorsToReadableMessages(errs).join(" / ")
  );

export const IoSignLollipopLocalsType = t.intersection([
  LollipopLocalsType,
  t.type({
    ["x-pagopa-lollipop-custom-sign-challenge"]: NonEmptyString,
    ["x-pagopa-lollipop-custom-tos-challenge"]: NonEmptyString,
  }),
]);
export type IoSignLollipopLocalsType = t.TypeOf<
  typeof IoSignLollipopLocalsType
>;

export const withIoSignCustomLollipopLocalsFromRequest =
  (req: express.Request) =>
  (
    lollipopLocals: LollipopLocalsType
  ): E.Either<IResponseErrorValidation, IoSignLollipopLocalsType> =>
    pipe(
      {
        ...lollipopLocals,
        ["x-pagopa-lollipop-custom-sign-challenge"]:
          req.headers["x-pagopa-lollipop-custom-sign-challenge"],
        ["x-pagopa-lollipop-custom-tos-challenge"]:
          req.headers["x-pagopa-lollipop-custom-tos-challenge"],
      },
      IoSignLollipopLocalsType.decode,
      E.mapLeft(responseErrorValidation)
    );

const responseErrorInternal = (reason: string) => (e: Error) =>
  ResponseErrorInternal(`${reason} | ${e.message}`);

const toErrorRetrievingTheSignerId = ResponseErrorInternal(
  `Error retrieving the signer id for this user`
);

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
        (e) =>
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
    withUserFromRequest(req, async (user) =>
      pipe(
        req.body,
        CreateFilledDocument.decode,
        E.mapLeft(responseErrorValidation),
        TE.fromEither,
        TE.chainW((body) =>
          pipe(
            sequenceS(TE.ApplySeq)({
              signerId: pipe(
                retrieveSignerId(this.ioSignService, user.fiscal_code),
                TE.mapLeft(() => toErrorRetrievingTheSignerId)
              ),
              userProfile: pipe(
                profileWithEmailValidatedOrError(this.profileService, user),
                TE.mapLeft(
                  responseErrorInternal(
                    "Error retrieving a user profile with validated email address"
                  )
                )
              ),
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

  /**
   * Create a Signature from a Signature Request
   */
  public readonly createSignature = async <T extends ResLocals>(
    req: express.Request,
    locals?: T
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<SignatureDetailView>
  > =>
    withUserFromRequest(req, (user) =>
      pipe(
        locals,
        /* Here we check the mandatory LolliPop HTTP headers[https://github.com/pagopa/io-backend/blob/master/openapi/consumed/lollipop_first_consumer.yaml#L58]
         * which contain the signatures and the parameters necessary for the QTSP to verify them.
         */
        withLollipopLocals,
        E.chain(withIoSignCustomLollipopLocalsFromRequest(req)),
        TE.fromEither,
        TE.chainW((ioSignLollipopLocals) =>
          pipe(
            sequenceS(TE.ApplySeq)({
              signerId: pipe(
                retrieveSignerId(this.ioSignService, user.fiscal_code),
                TE.mapLeft(() => toErrorRetrievingTheSignerId)
              ),
              userProfile: pipe(
                profileWithEmailValidatedOrError(this.profileService, user),
                TE.mapLeft(
                  responseErrorInternal(
                    "Error retrieving a user profile with validated email address"
                  )
                )
              ),
            }),
            TE.chainW(({ signerId, userProfile }) =>
              pipe(
                req.body,
                CreateSignatureBody.decode,
                E.mapLeft(responseErrorValidation),
                TE.fromEither,
                TE.map((signatureBody) => ({
                  body: {
                    ...signatureBody,
                    email: userProfile.email,
                  },
                  signerId: signerId.value.id,
                }))
              )
            ),
            TE.map(({ signerId, body }) =>
              this.ioSignService.createSignature(
                ioSignLollipopLocals,
                body,
                signerId
              )
            )
          )
        ),
        TE.toUnion
      )()
    );

  /**
   * Get a Signature Request from id
   */
  public readonly getSignatureRequest = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<SignatureRequestDetailView>
  > =>
    withUserFromRequest(req, async (user) =>
      pipe(
        sequenceS(TE.ApplyPar)({
          signatureRequestId: pipe(
            req.params.id,
            Id.decode,
            TE.fromEither,
            TE.mapLeft((_) =>
              ResponseErrorInternal(`Error validating the signature request id`)
            )
          ),
          signerId: pipe(
            retrieveSignerId(this.ioSignService, user.fiscal_code),
            TE.mapLeft(() => toErrorRetrievingTheSignerId),
            TE.map((response) => response.value.id)
          ),
        }),
        TE.map(({ signerId, signatureRequestId: id }) =>
          this.ioSignService.getSignatureRequest(id, signerId)
        ),
        TE.toUnion
      )()
    );

  /**
   * Get Signature Requests list from Signer
   */
  public readonly getSignatureRequests = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<SignatureRequestList>
  > =>
    withUserFromRequest(req, async (user) =>
      pipe(
        retrieveSignerId(this.ioSignService, user.fiscal_code),
        TE.mapLeft(() => toErrorRetrievingTheSignerId),
        TE.map((response) => response.value.id),
        TE.map((signerId) => this.ioSignService.getSignatureRequests(signerId)),
        TE.toUnion
      )()
    );

  public readonly getQtspClausesMetadata = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<QtspClausesMetadataDetailView>
  > =>
    withCatchAsInternalError(async () =>
      withValidatedOrValidationError(
        IssuerEnvironment.decode(
          "x-iosign-issuer-environment" in req.headers
            ? req.headers["x-iosign-issuer-environment"]
            : IssuerEnvironmentEnum.TEST
        ),
        this.ioSignService.getQtspClausesMetadata
      )
    );
}
