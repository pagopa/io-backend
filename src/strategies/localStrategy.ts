import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as passport from "passport";
import { Strategy } from "passport-local";
import { SpidUser } from "src/types/user";
import {
  Issuer,
  SPID_IDP_IDENTIFIERS,
} from "@pagopa/io-spid-commons/dist/config";
import { flow, identity, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as jose from "jose";
import { SpidLevelEnum } from "../../generated/backend/SpidLevel";
import {
  LollipopLoginParams,
  lollipopLoginHandler,
} from "../handlers/lollipop";
import { LollipopApiClient } from "../clients/lollipop";
import { log } from "../utils/logger";
import {
  getASAMLAssertion_saml2Namespace,
  getASAMLResponse_saml2Namespace,
} from "../utils/__mocks__/spid";

/**
 * Create a new Local Strategy with provided authorized fiscal code (user names)
 * and a fixed password. Returns unauthorized if validUsernameList does not contain
 * the fiscal code (user name) provided during login.
 */
export const localStrategy = (
  validUsernameList: ReadonlyArray<FiscalCode>,
  validPassword: string,
  isLollipopEnabled: boolean,
  lollipopApiClient: ReturnType<LollipopApiClient>
): passport.Strategy =>
  new Strategy({ passReqToCallback: true }, (req, username, password, done) => {
    pipe(
      TE.of(
        FiscalCode.is(username) &&
          validUsernameList.includes(username) &&
          validPassword === password
      ),
      TE.chain(
        TE.fromPredicate(
          (isValidAuth) => isValidAuth,
          () => new Error("Invalid credentials")
        )
      ),
      TE.chain(() =>
        TE.tryCatch(
          () => lollipopLoginHandler(isLollipopEnabled, lollipopApiClient)(req),
          E.toError
        )
      ),
      TE.chain(
        flow(
          TE.fromPredicate(
            (_): _ is undefined | LollipopLoginParams =>
              LollipopLoginParams.is(_) || _ === undefined,
            () => new Error("Invalid lollipop parameters")
          )
        )
      ),
      TE.chainW(
        flow(
          TE.fromPredicate(LollipopLoginParams.is, identity),
          TE.chainW((_) =>
            pipe(
              TE.tryCatch(
                () => jose.calculateJwkThumbprint(_.jwk, _.algo),
                E.toError
              ),
              TE.map(
                (thumbprint) => `${_.algo}-${thumbprint}` as NonEmptyString
              )
            )
          ),
          TE.orElse((_) => TE.of("_aTestValueRequestId" as NonEmptyString))
        )
      ),
      TE.map(
        (inResponseTo) =>
          ({
            authnContextClassRef:
              SpidLevelEnum["https://www.spid.gov.it/SpidL2"],
            dateOfBirth: "2000-06-02",
            familyName: "Rossi",
            fiscalNumber: username as FiscalCode, // Verified in line 31
            getAcsOriginalRequest: () => req,
            getAssertionXml: () =>
              getASAMLAssertion_saml2Namespace(
                username as FiscalCode,
                inResponseTo
              ),
            getSamlResponseXml: () =>
              getASAMLResponse_saml2Namespace(
                username as FiscalCode,
                inResponseTo
              ),
            issuer: Object.keys(SPID_IDP_IDENTIFIERS)[0] as Issuer,
            name: "Mario",
          } as SpidUser)
      ),
      TE.bimap(
        () => done(null, false),
        (user) => done(null, user)
      )
    )().catch((err) => {
      // This should doesn't happens, the left side is included on the `then` path
      log.error("localStrategy|unexpected error:%s", err);
      done(null, false);
    });
  });
