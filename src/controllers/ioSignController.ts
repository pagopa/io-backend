/**
 * This controller handles the IO_SIGN requests from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { sequenceS } from "fp-ts/lib/Apply";

import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorValidation
} from "@pagopa/ts-commons/lib/responses";

import IoSignService from "src/services/ioSignService";
import { pipe } from "fp-ts/lib/function";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { SignerDetailView } from "../../generated/io-sign-api/SignerDetailView";

import { FilledDocumentDetailView } from "../../generated/io-sign-api/FilledDocumentDetailView";

import { CreateFilledDocument } from "../../generated/io-sign/CreateFilledDocument";

import { User, withUserFromRequest } from "../types/user";
import ProfileService from "../services/profileService";

import { profileWithEmailValidatedOrError } from "../utils/profile";

export const retriveSignerId = (ioSignService: IoSignService, user: User) =>
  pipe(
    TE.tryCatch(
      () => ioSignService.getSignerByFiscalCode(user),
      () => new Error("Error retrieving signer id")
    ),
    TE.chain(
      TE.fromPredicate(
        (r): r is IResponseSuccessJson<SignerDetailView> =>
          r.kind === "IResponseSuccessJson",
        e => new Error(`Error retrieving signer id | ${e.detail}`)
      )
    ),
    TE.chainW(response =>
      pipe(
        response.value,
        SignerDetailView.decode,
        E.mapLeft(_ => new Error("Signer id is not valid")),
        TE.fromEither
      )
    )
  );
export default class IoSignController {
  constructor(
    private readonly ioSignService: IoSignService,
    private readonly profileService: ProfileService
  ) {}

  public readonly createFilledDocument = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<FilledDocumentDetailView>
  > =>
    withUserFromRequest(req, async user =>
      pipe(
        req.body,
        CreateFilledDocument.decode,
        E.mapLeft(() =>
          ResponseErrorValidation(
            "Payload not valid",
            "The body of the request is invalid!"
          )
        ),
        TE.fromEither,
        TE.chainW(body =>
          pipe(
            sequenceS(TE.ApplySeq)({
              signerId: pipe(
                retriveSignerId(this.ioSignService, user),
                TE.mapLeft(e =>
                  ResponseErrorInternal(
                    `Error retrieving signer id for this users | ${e.message}`
                  )
                )
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
                signerId.id
              )
            )
          )
        ),
        TE.toUnion
      )()
    );
}
