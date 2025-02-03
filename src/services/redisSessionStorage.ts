/**
 * This service uses the Redis client to store and retrieve session information.
 */

import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import * as ROA from "fp-ts/lib/ReadonlyArray";
import * as R from "fp-ts/lib/Record";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as B from "fp-ts/lib/boolean";
import { flow, identity, pipe } from "fp-ts/lib/function";
import { isArray } from "util";

import { AssertionRef as BackendAssertionRef } from "../../generated/backend/AssertionRef";
import { SessionInfo } from "../../generated/backend/SessionInfo";
import { SessionsList } from "../../generated/backend/SessionsList";
import {
  LollipopData,
  NullableBackendAssertionRefFromString
} from "../types/assertionRef";
import { assertUnreachable } from "../types/commons";
import {
  BPDToken,
  FIMSToken,
  MyPortalToken,
  SessionToken,
  WalletToken,
  ZendeskToken
} from "../types/token";
import { User, UserV1, UserV2, UserV3, UserV4, UserV5 } from "../types/user";
import { ActiveSessionInfo, LoginTypeEnum } from "../utils/fastLogin";
import { log } from "../utils/logger";
import { RedisClientMode, RedisClientSelectorType } from "../utils/redis";
import { ISessionStorage } from "./ISessionStorage";
import RedisStorageUtils from "./redisStorageUtils";

const sessionKeyPrefix = "SESSION-";
const walletKeyPrefix = "WALLET-";
const myPortalTokenPrefix = "MYPORTAL-";
const bpdTokenPrefix = "BPD-";
const zendeskTokenPrefix = "ZENDESK-";
const fimsTokenPrefix = "FIMS-";
const userSessionsSetKeyPrefix = "USERSESSIONS-";
const sessionInfoKeyPrefix = "SESSIONINFO-";
const noticeEmailPrefix = "NOTICEEMAIL-";
const blockedUserSetKey = "BLOCKEDUSERS";
const lollipopDataPrefix = "KEYS-";
export const keyPrefixes = [
  sessionKeyPrefix,
  walletKeyPrefix,
  myPortalTokenPrefix,
  fimsTokenPrefix,
  bpdTokenPrefix,
  zendeskTokenPrefix,
  userSessionsSetKeyPrefix,
  sessionInfoKeyPrefix,
  noticeEmailPrefix,
  blockedUserSetKey,
  lollipopDataPrefix
];
export const sessionNotFoundError = new Error("Session not found");

export default class RedisSessionStorage
  extends RedisStorageUtils
  implements ISessionStorage
{
  constructor(private readonly redisClientSelector: RedisClientSelectorType) {
    super();
  }

  /**
   * {@inheritDoc}
   */
  public async getBySessionToken(
    token: SessionToken
  ): Promise<Either<Error, Option<User>>> {
    const errorOrSession = await this.loadSessionBySessionToken(token);

    if (E.isLeft(errorOrSession)) {
      if (errorOrSession.left === sessionNotFoundError) {
        return E.right(O.none);
      }
      return E.left(errorOrSession.left);
    }

    const user = errorOrSession.right;

    return E.right(O.some(user));
  }

  /**
   * {@inheritDoc}
   */
  public async getByMyPortalToken(
    token: MyPortalToken
  ): Promise<Either<Error, Option<User>>> {
    const errorOrSession = await this.loadSessionByToken(
      myPortalTokenPrefix,
      token
    );

    if (E.isLeft(errorOrSession)) {
      if (errorOrSession.left === sessionNotFoundError) {
        return E.right(O.none);
      }
      return E.left(errorOrSession.left);
    }

    const user = errorOrSession.right;

    return E.right(O.some(user));
  }

  /**
   * {@inheritDoc}
   */
  public async del(user: User): Promise<Either<Error, boolean>> {
    const tokens: ReadonlyArray<string> = R.collect(
      (_, { prefix, value }) => `${prefix}${value}`
    )(this.getUserTokens(user));

    const deleteTokensPromiseV2 = await pipe(
      tokens,
      ROA.map((singleToken) =>
        TE.tryCatch(
          () =>
            this.redisClientSelector
              .selectOne(RedisClientMode.FAST)
              .del(singleToken),
          E.toError
        )
      ),
      ROA.sequence(TE.ApplicativeSeq),
      TE.map(ROA.reduce(0, (current, next) => current + next)),
      this.integerReplyAsync(tokens.length),
      this.falsyResponseToErrorAsync(
        new Error("Unexpected response from redis client deleting user tokens.")
      )
    )();

    if (E.isLeft(deleteTokensPromiseV2)) {
      return E.left(
        new Error(
          `value [${deleteTokensPromiseV2.left.message}] at RedisSessionStorage.del`
        )
      );
    }

    // Remove SESSIONINFO reference from USERSESSIONS Set
    // this operation is executed in background and doesn't compromise
    // the logout process.
    pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .sRem(
              `${userSessionsSetKeyPrefix}${user.fiscal_code}`,
              `${sessionInfoKeyPrefix}${user.session_token}`
            ),
        E.toError
      ),
      TE.mapLeft(() => {
        log.warn(`Error updating USERSESSIONS Set for ${user.fiscal_code}`);
      })
    )().catch(() => void 0);
    return E.right(true);
  }

  public async listUserSessions(
    user: User
  ): Promise<Either<Error, SessionsList>> {
    // If some user session was expired we update the USERSESSION Redis set.
    await this.clearExpiredSetValues(user.fiscal_code);

    const sessionKeys = await this.readSessionInfoKeys(user.fiscal_code);

    if (E.isLeft(sessionKeys)) {
      return E.left(sessionKeys.left);
    }

    return pipe(
      this.mGet([...sessionKeys.right]),
      TE.map((keys) =>
        this.parseUserSessionList(
          keys.filter((key) => key !== null) as ReadonlyArray<string>
        )
      )
    )();
  }

  /**
   * Remove expired `SESSIONINFO` value from the `USERSESSION` redis set.
   *
   * @param fiscalCode
   */
  public async clearExpiredSetValues(
    fiscalCode: string
  ): Promise<ReadonlyArray<Either<Error, boolean>>> {
    const userSessionSetKey = `${userSessionsSetKeyPrefix}${fiscalCode}`;
    const keysV2 = await pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .sMembers(userSessionSetKey),
        E.toError
      ),
      TE.mapLeft((err) => {
        log.error("Error reading set members: %s", err);
        return [] as Array<string>;
      }),
      TE.toUnion
    )();

    const activeKeys = await Promise.all(
      keysV2.map((key) =>
        pipe(
          TE.tryCatch(
            () =>
              this.redisClientSelector
                .selectOne(RedisClientMode.FAST)
                .exists(key),
            E.toError
          ),
          TE.chainW(TE.fromPredicate((response) => !!response, identity)),
          TE.bimap(
            () => key,
            () => key
          )
        )()
      )
    );

    return await Promise.all(
      pipe(
        activeKeys
          .filter(E.isLeft)
          .map((key) =>
            this.redisClientSelector
              .selectOne(RedisClientMode.FAST)
              .sRem(userSessionSetKey, key.left)
          ),
        (keysRemPromises) =>
          keysRemPromises.map((promise) =>
            pipe(
              TE.tryCatch(() => promise, E.toError),
              this.integerReplyAsync(),
              (task) => task()
            )
          )
      )
    );
  }

  /**
   * @deprecated use `userHasActiveSessionsOrLV` instead
   */
  public async userHasActiveSessions(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, boolean>> {
    const sessionKeys = await this.readSessionInfoKeys(fiscalCode);
    if (E.isLeft(sessionKeys)) {
      return sessionKeys.left === sessionNotFoundError
        ? E.right(false)
        : E.left(sessionKeys.left);
    }
    const errorOrSessionTokens = await pipe(
      this.mGet([...sessionKeys.right]),
      TE.map((keys) =>
        this.parseUserSessionList(
          keys.filter<string>((key): key is string => key !== null)
        ).sessions.map(
          (session) => `${sessionKeyPrefix}${session.sessionToken}`
        )
      )
    )();

    if (E.isLeft(errorOrSessionTokens)) {
      return E.left(errorOrSessionTokens.left);
    } else if (errorOrSessionTokens.right.length === 0) {
      return E.right(false);
    }

    return pipe(
      this.mGet(errorOrSessionTokens.right),
      // Skipping null values from the array
      TE.map(A.filter((key): key is string => key !== null)),
      TE.map((_) => _.length > 0)
    )();
  }

  /**
   * Check if user id logged in, by checking the presence of LollipopData.
   * It returns true if login type is LV or a LEGACY session exists, false otherwise
   *
   * @param fiscalCode
   * @returns true if login type is LV or a LEGACY session exists, false otherwise
   */
  public async userHasActiveSessionsOrLV(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, boolean>> {
    return await pipe(
      await this.getLollipopDataForUser(fiscalCode),
      TE.fromEither,
      TE.chain(
        flow(
          O.map((data) =>
            pipe(
              data.loginType === LoginTypeEnum.LV,
              B.fold(
                // if login type is not LV, check for active user sessions
                () =>
                  pipe(
                    TE.tryCatch(
                      () => this.userHasActiveSessions(fiscalCode),
                      E.toError
                    ),
                    TE.chainEitherK(identity)
                  ),
                // if login type is LV, return true
                () => TE.of<Error, boolean>(true)
              )
            )
          ),
          // ff no LollipopData was found, return false
          O.getOrElseW(() => TE.of<Error, boolean>(false))
        )
      )
    )();
  }

  /**
   * Insert a user in the list of blocked account
   *
   * @param fiscalCode id of the user
   *
   * @returns a promise with either an error or true
   */
  public setBlockedUser(fiscalCode: FiscalCode): Promise<Either<Error, true>> {
    return pipe(
      TE.tryCatch(() => {
        log.info(`Adding ${fiscalCode} to ${blockedUserSetKey} set`);
        return this.redisClientSelector
          .selectOne(RedisClientMode.FAST)
          .sAdd(blockedUserSetKey, fiscalCode);
      }, E.toError),
      TE.map<number, true>(() => true)
    )();
  }

  /**
   * Remove a user from the list of blocked account
   *
   * @param fiscalCode id of the user
   *
   * @returns a promise with either an error or true
   */
  public unsetBlockedUser(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, boolean>> {
    return pipe(
      TE.tryCatch(() => {
        log.info(`Removing ${fiscalCode} from ${blockedUserSetKey} set`);
        return this.redisClientSelector
          .selectOne(RedisClientMode.FAST)
          .sRem(blockedUserSetKey, fiscalCode);
      }, E.toError),
      this.integerReplyAsync(1),
      this.falsyResponseToErrorAsync(
        new Error(
          "Unexpected response from redis client deleting blockedUserKey"
        )
      )
    )();
  }

  /**
   * Delete all user session data
   *
   * @param fiscalCode
   */
  public async delUserAllSessions(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, boolean>> {
    const errorOrSessions = await this.readSessionInfoKeys(fiscalCode);

    const delEverySession = (
      sessionTokens: ReadonlyArray<SessionToken>
    ): TaskEither<Error, boolean> =>
      pipe(
        A.sequence(TE.ApplicativePar)<Error, boolean>(
          sessionTokens.map((sessionToken) =>
            pipe(
              TE.fromEither(
                pipe(
                  sessionToken,
                  SessionToken.decode,
                  E.mapLeft(() => new Error("Error decoding token"))
                )
              ),
              TE.chain((token: SessionToken) =>
                pipe(
                  TE.tryCatch(() => this.delSingleSession(token), E.toError),
                  TE.chain(TE.fromEither)
                )
              )
            )
          )
        ),
        TE.map(() => true)
      );

    return pipe(
      TE.fromEither(errorOrSessions),
      TE.fold(
        // as we're deleting stuff, a NotFound error can be considered as a success
        (error) =>
          error === sessionNotFoundError ? TE.of(true) : TE.left(error),
        (sessionInfoKeys) =>
          delEverySession(
            sessionInfoKeys.map(
              (sessionInfoKey) =>
                sessionInfoKey.replace(sessionInfoKeyPrefix, "") as SessionToken
            )
          )
      ),
      TE.chain(() =>
        pipe(
          TE.tryCatch(() => this.delSessionsSet(fiscalCode), E.toError),
          TE.chain(TE.fromEither)
        )
      )
    )();
  }

  /**
   * Delete notify email cache related to an user
   */
  public async delPagoPaNoticeEmail(user: User): Promise<Either<Error, true>> {
    return pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .del(`${noticeEmailPrefix}${user.session_token}`),
        E.toError
      ),
      TE.map<number, true>(() => true)
    )();
  }

  /**
   * {@inheritDoc}
   */
  public async getLollipopAssertionRefForUser(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, O.Option<BackendAssertionRef>>> {
    return pipe(
      await this.getLollipopDataForUser(fiscalCode),
      E.map(O.map((data) => data.assertionRef))
    );
  }

  /**
   * {@inheritDoc}
   */
  public async getLollipopDataForUser(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, O.Option<LollipopData>>> {
    return pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.SAFE)
            .get(`${lollipopDataPrefix}${fiscalCode}`),
        E.toError
      ),
      TE.chain(
        flow(
          NullableBackendAssertionRefFromString.decode,
          E.map(
            flow(
              O.fromNullable,
              O.map((storedValue) =>
                LollipopData.is(storedValue)
                  ? storedValue
                  : // Remap plain string to LollipopData
                    {
                      assertionRef: storedValue,
                      loginType: LoginTypeEnum.LEGACY
                    }
              )
            )
          ),
          E.mapLeft(
            (validationErrors) =>
              new Error(errorsToReadableMessages(validationErrors).join("/"))
          ),
          TE.fromEither
        )
      )
    )();
  }

  /**
   * {@inheritDoc}
   */
  public getSessionRemainingTTL(
    fiscalCode: FiscalCode
  ): TE.TaskEither<Error, O.Option<ActiveSessionInfo>> {
    return pipe(
      TE.tryCatch(
        // The `setLollipopDataForUser` has a default value for key `expire`
        // If the assertionRef is saved whidout providing an expire time related
        // with the session validity it will invalidate this implementation.
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.SAFE)
            .ttl(`${lollipopDataPrefix}${fiscalCode}`),
        E.toError
      ),
      TE.chain(
        TE.fromPredicate(
          (_) => _ !== -1,
          () => new Error("Unexpected missing CF-AssertionRef TTL")
        )
      ),
      TE.map(flow(O.fromPredicate((ttl) => ttl > 0))),
      TE.chain((maybeTtl) =>
        O.isNone(maybeTtl)
          ? TE.right(O.none)
          : pipe(
              TE.tryCatch(
                () => this.getLollipopDataForUser(fiscalCode),
                E.toError
              ),
              TE.chain(TE.fromEither),
              TE.chain(
                TE.fromPredicate(
                  O.isSome,
                  () => new Error("Unexpected missing value")
                )
              ),
              TE.map(({ value }) =>
                O.some({ ttl: maybeTtl.value, type: value.loginType })
              )
            )
      )
    );
  }

  /**
   * {@inheritDoc}
   */
  public async delLollipopDataForUser(fiscalCode: FiscalCode) {
    return pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .del(`${lollipopDataPrefix}${fiscalCode}`),
        E.toError
      ),
      this.integerReplyAsync()
    )();
  }

  // ----------------------------------------------
  // Private methods
  // ----------------------------------------------

  // This mGet fires a bunch of GET operation to prevent CROSS-SLOT errors on the cluster
  private mGet(keys: Array<string>): TaskEither<Error, Array<string | null>> {
    return pipe(
      keys,
      A.map((singleKey) =>
        TE.tryCatch(() => {
          const redis_client = this.redisClientSelector.selectOne(
            RedisClientMode.FAST
          );
          return redis_client.get.bind(redis_client)(singleKey);
        }, E.toError)
      ),
      A.sequence(TE.ApplicativePar)
    );
  }

  /**
   * Given a token, it removes user session token and wallet token
   *
   * @param token
   */
  private async delSingleSession(
    token: SessionToken
  ): Promise<Either<Error, boolean>> {
    try {
      const user: User = pipe(
        await this.loadSessionBySessionToken(token),
        E.getOrElseW((err) => {
          throw err;
        })
      );
      return this.del(user);
    } catch (error) {
      // as it's a delete, if the query fails for a NotFoudn error, it might be considered a success
      return error === sessionNotFoundError
        ? E.right(true)
        : E.left(E.toError(error));
    }
  }

  private delSessionsSet(fiscalCode: FiscalCode): Promise<Either<Error, true>> {
    return pipe(
      TE.tryCatch(() => {
        log.info(
          `Deleting sessions set ${userSessionsSetKeyPrefix}${fiscalCode}`
        );
        return this.redisClientSelector
          .selectOne(RedisClientMode.FAST)
          .del(`${userSessionsSetKeyPrefix}${fiscalCode}`);
      }, E.toError),
      TE.map<number, true>(() => true)
    )();
  }

  /**
   * Return a Session for this token.
   */
  private async loadSessionBySessionToken(
    token: SessionToken
  ): Promise<Either<Error, User>> {
    return pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .get(`${sessionKeyPrefix}${token}`),
        E.toError
      ),
      TE.chain(
        flow(
          O.fromNullable,
          E.fromOption(() => sessionNotFoundError),
          E.chain(this.parseUser),
          TE.fromEither
        )
      )
    )();
  }

  /**
   * Return a Session for this token.
   */
  private loadSessionByToken(
    prefix: string,
    token: WalletToken | MyPortalToken | BPDToken | ZendeskToken | FIMSToken
  ): Promise<Either<Error, User>> {
    return pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .get(`${prefix}${token}`),
        E.toError
      ),
      TE.chain(
        flow(
          O.fromNullable,
          TE.fromOption(() => sessionNotFoundError)
        )
      ),
      TE.chain((value) =>
        pipe(
          TE.tryCatch(
            () => this.loadSessionBySessionToken(value as SessionToken),
            E.toError
          ),
          TE.chain(TE.fromEither)
        )
      )
    )();
  }

  private readSessionInfoKeys(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, ReadonlyArray<string>>> {
    return pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .sMembers(`${userSessionsSetKeyPrefix}${fiscalCode}`),
        E.toError
      ),
      this.arrayStringReplyAsync
    );
  }

  private arrayStringReplyAsync(
    command: TE.TaskEither<Error, ReadonlyArray<string | null>>
  ): Promise<Either<Error, NonEmptyArray<string>>> {
    return pipe(
      command,
      TE.chain(
        TE.fromPredicate(
          (res): res is NonEmptyArray<string> => isArray(res) && res.length > 0,
          () => sessionNotFoundError
        )
      )
    )();
  }

  private parseUser(value: string): Either<Error, User> {
    return pipe(
      E.parseJSON(value, E.toError),
      E.chain(
        flow(
          User.decode,
          E.mapLeft((err) => new Error(errorsToReadableMessages(err).join("/")))
        )
      )
    );
  }

  private parseUserSessionList(
    userSessionTokensResult: ReadonlyArray<string>
  ): SessionsList {
    return userSessionTokensResult.reduce(
      (prev: SessionsList, _) =>
        pipe(
          E.parseJSON(_, E.toError),
          E.chain((data) =>
            pipe(
              SessionInfo.decode(data),
              E.mapLeft(
                (err) => new Error(errorsToReadableMessages(err).join("/"))
              )
            )
          ),
          E.fold(
            (err) => {
              log.warn("Unable to decode the session info: %s. Skipped.", err);
              return prev;
            },
            (sessionInfo) => ({
              sessions: [...prev.sessions, sessionInfo]
            })
          )
        ),
      { sessions: [] } as SessionsList
    );
  }

  private getUserTokens(
    user: User
  ): Record<string, { readonly prefix: string; readonly value: string }> {
    const requiredTokens = {
      session_info: {
        prefix: sessionInfoKeyPrefix,
        value: user.session_token
      },
      session_token: {
        prefix: sessionKeyPrefix,
        value: user.session_token
      },
      wallet_token: {
        prefix: walletKeyPrefix,
        value: user.wallet_token
      }
    };
    if (UserV5.is(user)) {
      return {
        ...requiredTokens,
        bpd_token: {
          prefix: bpdTokenPrefix,
          value: user.bpd_token
        },
        fims_token: {
          prefix: fimsTokenPrefix,
          value: user.fims_token
        },
        myportal_token: {
          prefix: myPortalTokenPrefix,
          value: user.myportal_token
        },
        zendesk_token: {
          prefix: zendeskTokenPrefix,
          value: user.zendesk_token
        }
      };
    }
    if (UserV4.is(user)) {
      return {
        ...requiredTokens,
        bpd_token: {
          prefix: bpdTokenPrefix,
          value: user.bpd_token
        },
        myportal_token: {
          prefix: myPortalTokenPrefix,
          value: user.myportal_token
        },
        zendesk_token: {
          prefix: zendeskTokenPrefix,
          value: user.zendesk_token
        }
      };
    }
    if (UserV3.is(user)) {
      return {
        ...requiredTokens,
        bpd_token: {
          prefix: bpdTokenPrefix,
          value: user.bpd_token
        },
        myportal_token: {
          prefix: myPortalTokenPrefix,
          value: user.myportal_token
        }
      };
    }
    if (UserV2.is(user)) {
      return {
        ...requiredTokens,
        myportal_token: {
          prefix: myPortalTokenPrefix,
          value: user.myportal_token
        }
      };
    }
    if (UserV1.is(user)) {
      return {
        ...requiredTokens
      };
    }
    return assertUnreachable(user);
  }
}
