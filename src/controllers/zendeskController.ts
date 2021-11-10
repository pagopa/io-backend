/**
 * This controller returns a token used to authenticate the logged user
 * to zendesk support
 */

import * as express from "express";
import { identity } from "fp-ts/lib/function";
import { fromLeft, taskEither, tryCatch } from "fp-ts/lib/TaskEither";
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
import { EmailString, NonEmptyString } from "italia-ts-commons/lib/strings";
import ProfileService from "src/services/profileService";

import { ZendeskToken } from "../../generated/backend/ZendeskToken";
import {
  JWT_ZENDESK_SUPPORT_TOKEN_EXPIRATION,
  JWT_ZENDESK_SUPPORT_TOKEN_ISSUER,
  JWT_ZENDESK_SUPPORT_TOKEN_SECRET
} from "../../src/config";
import TokenService from "../../src/services/tokenService";
import { withUserFromRequest } from "../types/user";

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
        .foldTaskEither(
          e => fromLeft<IResponseErrorInternal, InitializedProfile>(e),
          response => {
            if (response.kind !== "IResponseSuccessJson") {
              return fromLeft<
                | IResponseErrorInternal
                | IResponseErrorTooManyRequests
                | IResponseErrorNotFound,
                InitializedProfile
              >(response);
            }
            return taskEither.of(response.value);
          }
        )
        .chain(u => {
          const userEmail =
            u.email && u.is_email_validated
              ? u.email
              : (u.spid_email as EmailString);
          if (!userEmail) {
            return fromLeft<IResponseErrorInternal, string>(
              ResponseErrorInternal("User does not have an email address")
            );
          }
          return this.tokenService
            .getJwtZendeskSupportToken(
              JWT_ZENDESK_SUPPORT_TOKEN_SECRET,
              u.name as NonEmptyString,
              u.family_name as NonEmptyString,
              user.fiscal_code,
              userEmail,
              JWT_ZENDESK_SUPPORT_TOKEN_EXPIRATION,
              JWT_ZENDESK_SUPPORT_TOKEN_ISSUER
            )
            .mapLeft(e => ResponseErrorInternal(e.message));
        })
        .map(token =>
          ZendeskToken.encode({
            expires_in: JWT_ZENDESK_SUPPORT_TOKEN_EXPIRATION,
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
