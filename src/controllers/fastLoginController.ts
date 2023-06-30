import { getFastLoginLollipopConsumerClient } from "../clients/fastLoginLollipopConsumerClient";
import type * as express from "express";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as t from "io-ts";
import * as O from "fp-ts/lib/Option";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { ResLocals } from "../utils/express";
import { withLollipopLocals } from "../types/lollipop";
import { flow, identity, pipe } from "fp-ts/function";
import * as E from "fp-ts/lib/Either";
import * as AP from "fp-ts/lib/Apply";
import * as TE from "fp-ts/lib/TaskEither";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { FiscalCode } from "../../generated/io-bonus-api/FiscalCode";
import * as T from "fp-ts/lib/Task";
import { safeXMLParseFromString } from "@pagopa/io-spid-commons/dist/utils/samlUtils";
import TokenService from "../services/tokenService";
import { ISessionStorage } from "../services/ISessionStorage";
import { FastLoginResponse as LCFastLoginResponse } from "../../generated/fast-login-api/FastLoginResponse";
import {
  isUserElegibleForFastLogin,
  SESSION_ID_LENGTH_BYTES,
  SESSION_TOKEN_LENGTH_BYTES,
} from "./authenticationController";
import { makeProxyUserFromSAMLResponse } from "../utils/spid";
import { UserV5 } from "../types/user";
import {
  BPDToken,
  FIMSToken,
  MyPortalToken,
  SessionToken,
  WalletToken,
  ZendeskToken,
} from "../types/token";
import {
  IResponseErrorUnauthorized,
  ResponseErrorUnauthorized,
} from "../utils/responses";

const FastLoginResponse = t.type({
  token: NonEmptyString,
});

type FastLoginResponse = t.TypeOf<typeof FastLoginResponse>;

type UserTokens = {
  session_token: SessionToken;
  wallet_token: WalletToken;
  myportal_token: MyPortalToken;
  bpd_token: BPDToken;
  zendesk_token: ZendeskToken;
  fims_token: FIMSToken;
  session_tracking_id: string;
};

const generateSessionTokens = (
  userFiscalCode: FiscalCode,
  sessionStorage: ISessionStorage,
  tokenService: TokenService
): TE.TaskEither<
  IResponseErrorInternal | IResponseErrorUnauthorized,
  UserTokens
> => {
  // note: since we have a bunch of async operations that don't depend on
  //       each other, we can run them in parallel
  const tokenTasks = {
    // authentication token for app backend
    session_token: () =>
      tokenService.getNewTokenAsync(
        SESSION_TOKEN_LENGTH_BYTES
      ) as Promise<SessionToken>,
    // authentication token for pagoPA
    wallet_token: () =>
      tokenService.getNewTokenAsync(
        SESSION_TOKEN_LENGTH_BYTES
      ) as Promise<WalletToken>,
    // authentication token for MyPortal
    myportal_token: () =>
      tokenService.getNewTokenAsync(
        SESSION_TOKEN_LENGTH_BYTES
      ) as Promise<MyPortalToken>,
    // authentication token for BPD
    bpd_token: () =>
      tokenService.getNewTokenAsync(
        SESSION_TOKEN_LENGTH_BYTES
      ) as Promise<BPDToken>,
    // authentication token for Zendesk
    zendesk_token: () =>
      tokenService.getNewTokenAsync(
        SESSION_TOKEN_LENGTH_BYTES
      ) as Promise<ZendeskToken>,
    // authentication token for FIMS
    fims_token: () =>
      tokenService.getNewTokenAsync(
        SESSION_TOKEN_LENGTH_BYTES
      ) as Promise<FIMSToken>,
    // unique ID for tracking the user session
    session_tracking_id: () =>
      tokenService.getNewTokenAsync(SESSION_ID_LENGTH_BYTES),
  };

  // ask the session storage whether this user is blocked
  const isUserBlockedTE: TE.TaskEither<Error, boolean> = () =>
    sessionStorage.isBlockedUser(userFiscalCode);

  return pipe(
    isUserBlockedTE,
    TE.mapLeft(() => ResponseErrorInternal(`Error while validating user`)),
    TE.chainW((isUserBlocked) =>
      isUserBlocked
        ? TE.right(true)
        : TE.left(ResponseErrorUnauthorized("User is blocked"))
    ),
    TE.chainW(() => pipe(tokenTasks, AP.sequenceS(T.ApplyPar), TE.fromTask))
  );
};

const createSessionForUser = (
  user: UserV5,
  sessionStorage: ISessionStorage,
  sessionTTL: number
): TE.TaskEither<IResponseErrorInternal, true> =>
  pipe(
    // create a new session and delete the old one if present
    () => sessionStorage.set(user, sessionTTL),
    TE.mapLeft((err) =>
      ResponseErrorInternal(
        `Could not create user using session storage: ${err.message}`
      )
    ),
    TE.chain(
      TE.fromPredicate(identity, (value) =>
        ResponseErrorInternal(
          `Could not create user: session storage returned ${value} `
        )
      )
    ),
    TE.map(() => true)
  );

// TODO: this is NOT NEEDED for the first release of fast-login, however
// it MUST BE implemented afterwards
const callLcSetSession = (): TE.TaskEither<IResponseErrorInternal, true> =>
  TE.of(true);

export const fastLoginEndpoint =
  (
    client: ReturnType<getFastLoginLollipopConsumerClient>,
    sessionStorage: ISessionStorage,
    tokenService: TokenService,
    sessionTTL: number
  ) =>
  async <T extends ResLocals>(
    _: express.Request,
    locals?: T
  ): Promise<
    | IResponseErrorUnauthorized
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseSuccessJson<FastLoginResponse>
  > => {
    return pipe(
      locals,
      withLollipopLocals,
      E.mapLeft((_) => ResponseErrorInternal("Could not initialize Lollipop")),
      TE.fromEither,
      // TODO: remove this block of code when the FF_FAST_LOGIN will be set to ALL
      // ---------------
      TE.chainFirstW(
        TE.fromPredicate(
          (locals) =>
            isUserElegibleForFastLogin(locals["x-pagopa-lollipop-user-id"]),
          () => ResponseErrorForbiddenNotAuthorized
        )
      ),
      // ---------------
      TE.chainFirst((locals) =>
        pipe(
          TE.tryCatch(
            () =>
              sessionStorage.getLollipopAssertionRefForUser(
                locals["x-pagopa-lollipop-user-id"]
              ),
            () =>
              ResponseErrorInternal(
                `Error while trying to get Lollipop initialization`
              )
          ),
          TE.chainEitherKW(
            E.mapLeft((error) =>
              ResponseErrorInternal(
                `Error while validating Lollipop initialization: ${error.message}`
              )
            )
          ),
          TE.chainW(
            TE.fromPredicate(
              (maybeAssertionRef) =>
                O.isSome(maybeAssertionRef) &&
                maybeAssertionRef.value ===
                  locals["x-pagopa-lollipop-assertion-ref"],
              () => ResponseErrorForbiddenNotAuthorized
            )
          )
        )
      ),
      TE.bindTo("lollipopLocals"),
      TE.bindW("client_response", ({ lollipopLocals }) =>
        pipe(
          TE.tryCatch(
            () =>
              client.fastLogin({
                ...lollipopLocals,
              }),
            (_) =>
              ResponseErrorInternal("Error while calling the Lollipop Consumer")
          ),
          TE.chainEitherKW(
            E.mapLeft(
              flow(readableReportSimplified, (message) =>
                ResponseErrorInternal(
                  `Unexpected Lollipop consumer response: ${message}`
                )
              )
            )
          ),
          TE.chainW((lcResponse) =>
            lcResponse.status === 200
              ? TE.right<
                  IResponseErrorInternal | IResponseErrorUnauthorized,
                  LCFastLoginResponse
                >(lcResponse.value)
              : lcResponse.status === 401
              ? TE.left(
                  ResponseErrorUnauthorized(
                    "Invalid signature or nonce expired"
                  )
                )
              : TE.left(
                  ResponseErrorInternal(
                    `Error in Lollipop consumer. Response contains ${lcResponse.status} with title ${lcResponse.value.title} and detail ${lcResponse.value.detail}`
                  )
                )
          )
        )
      ),
      TE.bindW("parsed_saml_response", ({ client_response }) =>
        pipe(
          client_response.saml_response,
          safeXMLParseFromString,
          TE.fromOption(() =>
            ResponseErrorInternal(
              "Could not parse saml response from Lollipop consumer"
            )
          )
        )
      ),
      TE.bindW("tokens", ({ lollipopLocals }) =>
        generateSessionTokens(
          lollipopLocals["x-pagopa-lollipop-user-id"],
          sessionStorage,
          tokenService
        )
      ),
      TE.bindW("userWithoutTokens", ({ parsed_saml_response }) =>
        pipe(
          parsed_saml_response,
          makeProxyUserFromSAMLResponse,
          TE.fromOption(() =>
            ResponseErrorInternal("Could not create proxy user")
          )
        )
      ),
      TE.chainFirstW(({ userWithoutTokens, tokens }) =>
        createSessionForUser(
          {
            ...userWithoutTokens,
            ...tokens,
          },
          sessionStorage,
          sessionTTL
        )
      ),
      TE.chainFirstW(callLcSetSession),
      TE.chainEitherKW(({ tokens }) =>
        pipe(
          tokens.session_token,
          NonEmptyString.decode,
          E.mapLeft((errors) =>
            ResponseErrorInternal(
              `Could not decode session token|${readableReportSimplified(
                errors
              )}`
            )
          )
        )
      ),
      TE.map((sessionToken) =>
        ResponseSuccessJson({
          token: sessionToken,
        })
      ),
      TE.toUnion
    )();
  };
