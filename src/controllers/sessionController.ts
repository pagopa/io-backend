/**
 * This controller returns data about the current user session
 */

import * as crypto from "crypto";
import * as express from "express";
import * as O from "fp-ts/Option";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import TokenService from "../services/tokenService";
import {
  BPDToken,
  FIMSToken,
  MyPortalToken,
  ZendeskToken,
} from "../types/token";
import { SessionsList } from "../../generated/backend/SessionsList";
import { PublicSession } from "../../generated/backend/PublicSession";
import RedisSessionStorage from "../services/redisSessionStorage";
import {
  UserV2,
  UserV3,
  UserV4,
  UserV5,
  withUserFromRequest,
} from "../types/user";

import { log } from "../utils/logger";
import ProfileService from "../services/profileService";
import { profileWithEmailValidatedOrError } from "../utils/profile";
import { SESSION_TOKEN_LENGTH_BYTES } from "./authenticationController";

export default class SessionController {
  constructor(
    private readonly sessionStorage: RedisSessionStorage,
    private readonly tokenService: TokenService,
    private readonly profileService: ProfileService
  ) {}
  public readonly getSessionState = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<PublicSession>
  > =>
    withUserFromRequest(req, async (user) => {
      const zendeskSuffix = await pipe(
        profileWithEmailValidatedOrError(this.profileService, user),
        TE.bimap(
          // we generate 4 bytes and convert them to hex string for a length of 8 chars
          (_) => crypto.randomBytes(4).toString("hex"),
          // or we take 8 chars from the hash hex string
          (p) =>
            crypto
              .createHash("sha256")
              .update(p.email)
              .digest("hex")
              .substring(0, 8)
        ),
        TE.toUnion
      )();

      // Read the assertionRef related to the User for Lollipop.
      const errorOrMaybeAssertionRef =
        await this.sessionStorage.getLollipopAssertionRefForUser(
          user.fiscal_code
        );
      if (E.isLeft(errorOrMaybeAssertionRef)) {
        return ResponseErrorInternal(
          `Error retrieving the assertionRef: ${errorOrMaybeAssertionRef.left.message}`
        );
      }

      if (UserV5.is(user)) {
        // All required tokens are present on the current session, no update is required
        return ResponseSuccessJson({
          bpdToken: user.bpd_token,
          fimsToken: user.fims_token,
          lollipopAssertionRef: O.toUndefined(errorOrMaybeAssertionRef.right),
          myPortalToken: user.myportal_token,
          spidLevel: user.spid_level,
          walletToken: user.wallet_token,
          zendeskToken: `${user.zendesk_token}${zendeskSuffix}`,
        });
      }

      // If the myportal_token, zendesk_token or bpd_token are missing into the user session,
      // new tokens are generated and the session is updated
      const updatedUser: UserV5 = {
        ...user,
        bpd_token: UserV3.is(user)
          ? user.bpd_token
          : (this.tokenService.getNewToken(
              SESSION_TOKEN_LENGTH_BYTES
            ) as BPDToken),
        fims_token: this.tokenService.getNewToken(
          SESSION_TOKEN_LENGTH_BYTES
        ) as FIMSToken,
        myportal_token: UserV2.is(user)
          ? user.myportal_token
          : (this.tokenService.getNewToken(
              SESSION_TOKEN_LENGTH_BYTES
            ) as MyPortalToken),
        zendesk_token: UserV4.is(user)
          ? user.zendesk_token
          : (this.tokenService.getNewToken(
              SESSION_TOKEN_LENGTH_BYTES
            ) as ZendeskToken),
      };

      return pipe(
        await this.sessionStorage.update(updatedUser),
        E.mapLeft((err) => {
          log.error(`getSessionState: ${err.message}`);
          return ResponseErrorInternal(
            `Error updating user session [${err.message}]`
          );
        }),
        E.map((_) =>
          ResponseSuccessJson({
            bpdToken: updatedUser.bpd_token,
            fimsToken: updatedUser.fims_token,
            lollipopAssertionRef: O.toUndefined(errorOrMaybeAssertionRef.right),
            myPortalToken: updatedUser.myportal_token,
            spidLevel: updatedUser.spid_level,
            walletToken: updatedUser.wallet_token,
            zendeskToken: `${updatedUser.zendesk_token}${zendeskSuffix}`,
          })
        ),
        E.toUnion
      );
    });

  public readonly listSessions = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<SessionsList>
  > =>
    withUserFromRequest(req, async (user) => {
      const sessionsList = await this.sessionStorage.listUserSessions(user);
      if (E.isLeft(sessionsList)) {
        return ResponseErrorInternal(sessionsList.left.message);
      }
      if (sessionsList.right.sessions.length === 0) {
        return ResponseErrorInternal("No valid sessions found for the user");
      }
      return ResponseSuccessJson<SessionsList>(sessionsList.right);
    });
}
