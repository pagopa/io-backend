/**
 * This controller returns a token used to authenticate the logged user
 * to zendesk support
 */

import * as express from "express";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { InitializedProfile } from "generated/backend/InitializedProfile";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
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

// define a predicate to validate a profile by email confirmation
const isProfileWithValidEmailAddress = (
  userProfile: InitializedProfile
): userProfile is InitializedProfile =>
  !!(userProfile.email && userProfile.is_email_validated);

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
    | IResponseErrorTooManyRequests
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseSuccessJson<ZendeskToken>
  > =>
    withUserFromRequest(req, async user => {
      const userProfile = await this.profileService.getProfile(user);
      return await pipe(
        TE.of(userProfile),
        TE.chain(r =>
          r.kind === "IResponseSuccessJson" ? TE.of(r.value) : TE.left(r)
        ),
        TE.chainW(profile =>
          pipe(
            profile,
            TE.fromPredicate(isProfileWithValidEmailAddress, () =>
              ResponseErrorInternal("User does not have an email address")
            )
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
      )();
    });
}
