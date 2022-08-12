/**
 * This controller returns a token used to authenticate the logged user
 * to zendesk support
 */

import * as express from "express";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import {
  EmailString,
  FiscalCode,
  NonEmptyString
} from "@pagopa/ts-commons/lib/strings";
import ProfileService from "src/services/profileService";
import * as t from "io-ts/lib";
import { pipe } from "fp-ts/lib/function";
import { ZendeskToken } from "../../generated/zendesk/ZendeskToken";
import {
  JWT_ZENDESK_SUPPORT_TOKEN_EXPIRATION,
  JWT_ZENDESK_SUPPORT_TOKEN_ISSUER,
  JWT_ZENDESK_SUPPORT_TOKEN_SECRET
} from "../../src/config";
import TokenService from "../../src/services/tokenService";
import { withUserFromRequest } from "../types/user";
import { profileWithEmailValidatedOrError } from "../utils/profile";

// define a ValidZendeskProfile as a subset of InitializedProfile model
const ValidZendeskProfile = t.interface({
  email: EmailString,
  family_name: NonEmptyString,
  fiscal_code: FiscalCode,
  name: NonEmptyString
});
type ValidZendeskProfile = t.TypeOf<typeof ValidZendeskProfile>;

export default class ZendeskController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly tokenService: TokenService
  ) {}

  public readonly getZendeskSupportToken = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<ZendeskToken>
  > =>
    withUserFromRequest(req, user =>
      pipe(
        profileWithEmailValidatedOrError(this.profileService, user),
        TE.mapLeft(e =>
          ResponseErrorInternal(
            `Error retrieving a user profile with validated email address | ${e.message}`
          )
        ),
        TE.chainW(profileWithValidEmailAddress =>
          TE.fromEither(
            pipe(
              ValidZendeskProfile.decode(profileWithValidEmailAddress),
              E.mapLeft(() =>
                ResponseErrorInternal(
                  "Cannot create a valid Zendesk user from this profile"
                )
              )
            )
          )
        ),
        TE.chainW(validZendeskProfile =>
          pipe(
            this.tokenService.getJwtZendeskSupportToken(
              JWT_ZENDESK_SUPPORT_TOKEN_SECRET,
              validZendeskProfile.name,
              validZendeskProfile.family_name,
              validZendeskProfile.fiscal_code,
              validZendeskProfile.email,
              JWT_ZENDESK_SUPPORT_TOKEN_EXPIRATION,
              JWT_ZENDESK_SUPPORT_TOKEN_ISSUER
            ),
            TE.mapLeft(e => ResponseErrorInternal(e.message))
          )
        ),
        TE.map(token =>
          ZendeskToken.encode({
            jwt: token
          })
        ),
        TE.map(ResponseSuccessJson),
        TE.toUnion
      )()
    );
}
