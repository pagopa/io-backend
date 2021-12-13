/**
 * This controller returns a token used to authenticate the logged user
 * to zendesk support
 */

import * as express from "express";
import { identity } from "fp-ts/lib/function";
import {
  fromLeft,
  taskEither,
  tryCatch,
  fromPredicate
} from "fp-ts/lib/TaskEither";
import { InitializedProfile } from "generated/backend/InitializedProfile";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import ProfileService from "src/services/profileService";
import { ZendeskToken } from "../../generated/zendesk/ZendeskToken";
import {
  JWT_ZENDESK_SUPPORT_TOKEN_EXPIRATION,
  JWT_ZENDESK_SUPPORT_TOKEN_ISSUER,
  JWT_ZENDESK_SUPPORT_TOKEN_SECRET
} from "../../src/config";
import TokenService from "../../src/services/tokenService";
import { withUserFromRequest } from "../types/user";

const isProfileWithValidEmailAddress = (userProfile =>
  userProfile.email && userProfile.is_email_validated) as (
  a: InitializedProfile
) => a is InitializedProfile;

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
    withUserFromRequest(req, async user =>
      tryCatch(
        () => this.profileService.getProfile(user),
        () => ResponseErrorInternal("Cannot retrieve profile")
      )
        .mapLeft<
          | IResponseErrorInternal
          | IResponseErrorTooManyRequests
          | IResponseErrorNotFound
        >(identity)
        .chain<IResponseSuccessJson<InitializedProfile>>(r =>
          r.kind === "IResponseSuccessJson" ? taskEither.of(r) : fromLeft(r)
        )
        .map(r => r.value)
        .chain(fromProfileUser =>
          fromPredicate(isProfileWithValidEmailAddress, _ =>
            ResponseErrorInternal("User does not have an email address")
          )(fromProfileUser)
        )
        .chain(profileWithValidEmailAddress =>
          this.tokenService
            .getJwtZendeskSupportToken(
              JWT_ZENDESK_SUPPORT_TOKEN_SECRET,
              profileWithValidEmailAddress.name as NonEmptyString,
              profileWithValidEmailAddress.family_name as NonEmptyString,
              profileWithValidEmailAddress.fiscal_code,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              profileWithValidEmailAddress.email!,
              JWT_ZENDESK_SUPPORT_TOKEN_EXPIRATION,
              JWT_ZENDESK_SUPPORT_TOKEN_ISSUER
            )
            .mapLeft(e => ResponseErrorInternal(e.message))
        )
        .map(token =>
          ZendeskToken.encode({
            jwt: token
          })
        )
        .fold<
          | IResponseErrorInternal
          | IResponseErrorTooManyRequests
          | IResponseErrorNotFound
          | IResponseSuccessJson<ZendeskToken>
        >(identity, ResponseSuccessJson)
        .run()
    );
}
