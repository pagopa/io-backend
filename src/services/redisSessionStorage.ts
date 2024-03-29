/**
 * This service uses the Redis client to store and retrieve session information.
 */

import { isArray } from "util";
import * as A from "fp-ts/lib/Array";
import * as ROA from "fp-ts/lib/ReadonlyArray";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as B from "fp-ts/lib/boolean";
import * as R from "fp-ts/lib/Record";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { EmailString, FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { flow, pipe, identity } from "fp-ts/lib/function";
import { Second } from "@pagopa/ts-commons/lib/units";
import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";
import {
  NullableBackendAssertionRefFromString,
  LollipopData,
  LollipopDataFromString,
} from "../types/assertionRef";
import { AssertionRef as BackendAssertionRef } from "../../generated/backend/AssertionRef";
import { SessionInfo } from "../../generated/backend/SessionInfo";
import { SessionsList } from "../../generated/backend/SessionsList";
import { assertUnreachable } from "../types/commons";
import {
  BPDToken,
  FIMSToken,
  MyPortalToken,
  SessionToken,
  WalletToken,
  ZendeskToken,
} from "../types/token";
import { User, UserV1, UserV2, UserV3, UserV4, UserV5 } from "../types/user";
import { multipleErrorsFormatter } from "../utils/errorsFormatter";
import { log } from "../utils/logger";
import { ActiveSessionInfo, LoginTypeEnum } from "../utils/fastLogin";
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
  lollipopDataPrefix,
];
export const sessionNotFoundError = new Error("Session not found");

export default class RedisSessionStorage
  extends RedisStorageUtils
  implements ISessionStorage
{
  constructor(
    private readonly redisClientSelector: RedisClientSelectorType,
    private readonly tokenDurationSecs: number,
    private readonly defaultDurationAssertionRefSec: Second
  ) {
    super();
  }

  /**
   * {@inheritDoc}
   */
  // eslint-disable-next-line max-lines-per-function
  public async set(
    user: UserV5,
    expireSec: number = this.tokenDurationSecs,
    isUserSessionUpdate: boolean = false
  ): Promise<Either<Error, boolean>> {
    const setSessionTokenV2 = pipe(
      TE.tryCatch(
        () =>
          // Set key to hold the string value. If key already holds a value, it is overwritten, regardless of its type.
          // @see https://redis.io/commands/set
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .setEx(
              `${sessionKeyPrefix}${user.session_token}`,
              expireSec,
              JSON.stringify(user)
            ),
        E.toError
      ),
      this.singleStringReplyAsync,
      this.falsyResponseToErrorAsync(new Error("Error setting session token"))
    );

    const setWalletTokenV2 = pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .setEx(
              `${walletKeyPrefix}${user.wallet_token}`,
              expireSec,
              user.session_token
            ),
        E.toError
      ),
      this.singleStringReplyAsync,
      this.falsyResponseToErrorAsync(new Error("Error setting wallet token"))
    );

    const setMyPortalTokenV2 = pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .setEx(
              `${myPortalTokenPrefix}${user.myportal_token}`,
              expireSec,
              user.session_token
            ),
        E.toError
      ),
      this.singleStringReplyAsync,
      this.falsyResponseToErrorAsync(new Error("Error setting MyPortal token"))
    );

    const setBPDTokenV2 = pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .setEx(
              `${bpdTokenPrefix}${user.bpd_token}`,
              expireSec,
              user.session_token
            ),
        E.toError
      ),
      this.singleStringReplyAsync,
      this.falsyResponseToErrorAsync(new Error("Error setting BPD token"))
    );

    const setZendeskTokenV2 = pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .setEx(
              `${zendeskTokenPrefix}${user.zendesk_token}`,
              expireSec,
              user.session_token
            ),
        E.toError
      ),
      this.singleStringReplyAsync,
      this.falsyResponseToErrorAsync(new Error("Error setting Zendesk token"))
    );

    const setFIMSTokenV2 = pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .setEx(
              `${fimsTokenPrefix}${user.fims_token}`,
              expireSec,
              user.session_token
            ),
        E.toError
      ),
      this.singleStringReplyAsync,
      this.falsyResponseToErrorAsync(new Error("Error setting FIMS token"))
    );

    // If is a session update, the session info key doesn't must be updated.
    // eslint-disable-next-line functional/no-let
    let saveSessionInfoPromise: TE.TaskEither<Error, boolean> = TE.right(true);
    if (!isUserSessionUpdate) {
      const sessionInfo: SessionInfo = {
        createdAt: new Date(),
        sessionToken: user.session_token,
      };
      saveSessionInfoPromise = this.saveSessionInfo(
        sessionInfo,
        user.fiscal_code,
        expireSec
      );
    }

    const removeOtherUserSessionsPromise = this.removeOtherUserSessions(user);

    const setPromisesResult = await pipe(
      A.sequence(T.taskSeq)([
        setSessionTokenV2,
        setWalletTokenV2,
        setMyPortalTokenV2,
        setBPDTokenV2,
        setZendeskTokenV2,
        setFIMSTokenV2,
        saveSessionInfoPromise,
        pipe(
          TE.tryCatch(() => removeOtherUserSessionsPromise, E.toError),
          TE.mapLeft((e) => E.left<Error, boolean>(e)),
          TE.toUnion
        ),
      ])
    )();
    const isSetFailed = setPromisesResult.some(E.isLeft);
    if (isSetFailed) {
      return E.left<Error, boolean>(
        multipleErrorsFormatter(
          setPromisesResult.filter(E.isLeft).map((result) => result.left),
          "RedisSessionStorage.set"
        )
      );
    }
    return E.right<Error, boolean>(true);
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
  public async getByWalletToken(
    token: WalletToken
  ): Promise<Either<Error, Option<User>>> {
    const errorOrSession = await this.loadSessionByToken(
      walletKeyPrefix,
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
  public async getByBPDToken(
    token: BPDToken
  ): Promise<Either<Error, Option<User>>> {
    const errorOrSession = await this.loadSessionByToken(bpdTokenPrefix, token);

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
  public async getByZendeskToken(
    token: ZendeskToken
  ): Promise<Either<Error, Option<User>>> {
    const errorOrSession = await this.loadSessionByToken(
      zendeskTokenPrefix,
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
  public async getByFIMSToken(
    token: FIMSToken
  ): Promise<Either<Error, Option<User>>> {
    const errorOrSession = await this.loadSessionByToken(
      fimsTokenPrefix,
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
      TE.mapLeft((_) => {
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
        // eslint-disable-next-line functional/prefer-readonly-type
        return [] as string[];
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
      TE.map<number, true>((_) => true)
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
   * Check if a user is blocked
   *
   * @param fiscalCode id of the user
   *
   * @returns a promise with either an error or a boolean indicating if the user is blocked
   */
  public async isBlockedUser(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, boolean>> {
    return pipe(
      TE.tryCatch(
        () => this.sIsMember(blockedUserSetKey, fiscalCode),
        E.toError
      ),
      TE.bimap(
        (err) => new Error(`Error accessing blocked users collection: ${err}`),
        identity
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
                  E.mapLeft((_) => new Error("Error decoding token"))
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
      TE.chain((_) =>
        pipe(
          TE.tryCatch(() => this.delSessionsSet(fiscalCode), E.toError),
          TE.chain(TE.fromEither)
        )
      )
    )();
  }

  /**
   * Update an user session keeping the current session TTL
   *
   * @param updatedUser
   */
  public async update(updatedUser: UserV5): Promise<Either<Error, boolean>> {
    const errorOrSessionTtl = await this.getSessionTtl(
      updatedUser.session_token
    );

    if (E.isLeft(errorOrSessionTtl)) {
      return E.left(
        new Error(
          `Error retrieving user session ttl [${errorOrSessionTtl.left.message}]`
        )
      );
    }
    const sessionTtl = errorOrSessionTtl.right;
    if (sessionTtl < 0) {
      throw new Error(`Unexpected session TTL value [${sessionTtl}]`);
    }

    // We here update all the token but we can optimize it updating only missing tokens
    const errorOrIsSessionUpdated = await this.set(
      updatedUser,
      sessionTtl,
      true
    );
    if (E.isLeft(errorOrIsSessionUpdated)) {
      return E.left(
        new Error(
          `Error updating user session [${errorOrIsSessionUpdated.left.message}]`
        )
      );
    }
    return E.right(true);
  }

  /**
   * Cache on redis the notify email for pagopa
   */
  public async setPagoPaNoticeEmail(
    user: User,
    NoticeEmail: EmailString
  ): Promise<Either<Error, boolean>> {
    const errorOrSessionTtl = await this.getSessionTtl(user.session_token);

    if (E.isLeft(errorOrSessionTtl)) {
      return E.left(
        new Error(
          `Error retrieving user session ttl [${errorOrSessionTtl.left.message}]`
        )
      );
    }
    const sessionTtl = errorOrSessionTtl.right;
    if (sessionTtl < 0) {
      throw new Error(`Unexpected session TTL value [${sessionTtl}]`);
    }

    return pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .setEx(
              `${noticeEmailPrefix}${user.session_token}`,
              sessionTtl,
              NoticeEmail
            ),
        E.toError
      ),
      this.singleStringReplyAsync,
      this.falsyResponseToErrorAsync(new Error("Error setting session token"))
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
      TE.map<number, true>((_) => true)
    )();
  }

  /**
   * Get the notify email value from cache
   */
  public async getPagoPaNoticeEmail(
    user: User
  ): Promise<Either<Error, EmailString>> {
    return pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .get(`${noticeEmailPrefix}${user.session_token}`),
        E.toError
      ),
      TE.chain((maybeEmail) =>
        pipe(
          O.fromNullable(maybeEmail),
          TE.fromOption(() => new Error("Notify email value not found")),
          TE.chain(
            flow(
              EmailString.decode,
              TE.fromEither,
              TE.mapLeft(
                (validationErrors) =>
                  new Error(
                    errorsToReadableMessages(validationErrors).join("/")
                  )
              )
            )
          )
        )
      )
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
                      loginType: LoginTypeEnum.LEGACY,
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
  public async setLollipopDataForUser(
    user: UserV5,
    data: LollipopData,
    expireAssertionRefSec: Second = this.defaultDurationAssertionRefSec
  ) {
    return pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .setEx(
              `${lollipopDataPrefix}${user.fiscal_code}`,
              expireAssertionRefSec,
              LollipopDataFromString.encode(data)
            ),
        E.toError
      ),
      this.singleStringReplyAsync,
      this.falsyResponseToErrorAsync(new Error("Error setting user key"))
    )();
  }

  /**
   * {@inheritDoc}
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public async setLollipopAssertionRefForUser(
    user: UserV5,
    assertionRef: BackendAssertionRef,
    expireAssertionRefSec: Second = this.defaultDurationAssertionRefSec
  ) {
    return pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .setEx(
              `${lollipopDataPrefix}${user.fiscal_code}`,
              expireAssertionRefSec,
              assertionRef
            ),
        E.toError
      ),
      this.singleStringReplyAsync,
      this.falsyResponseToErrorAsync(new Error("Error setting user key"))
    )();
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
  // eslint-disable-next-line functional/prefer-readonly-type
  private mGet(keys: string[]): TaskEither<Error, Array<string | null>> {
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

  private sIsMember(key: string, member: string) {
    const redis_client = this.redisClientSelector.selectOne(
      RedisClientMode.FAST
    );
    return redis_client.sIsMember.bind(redis_client)(key, member);
  }

  private ttl(key: string) {
    const redis_client = this.redisClientSelector.selectOne(
      RedisClientMode.FAST
    );
    return redis_client.ttl.bind(redis_client)(key);
  }

  /**
   * Return the session token remaining time to live in seconds
   *
   * @param token
   */
  private async getSessionTtl(
    token: SessionToken
  ): Promise<Either<Error, number>> {
    // Returns the key ttl in seconds
    // -2 if the key doesn't exist or -1 if the key has no expire
    // @see https://redis.io/commands/ttl
    return TE.tryCatch(
      () => this.ttl(`${sessionKeyPrefix}${token}`),
      E.toError
    )();
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
      TE.map<number, true>((_) => true)
    )();
  }

  /*
   * Store session info and update session info set.
   * The returned promise will reject if either operation fail.
   * update session info set
   */
  private saveSessionInfo(
    sessionInfo: SessionInfo,
    fiscalCode: FiscalCode,
    expireSec: number
  ): TE.TaskEither<Error, boolean> {
    const sessionInfoKey = `${sessionInfoKeyPrefix}${sessionInfo.sessionToken}`;
    return pipe(
      TE.tryCatch(
        () =>
          this.redisClientSelector
            .selectOne(RedisClientMode.FAST)
            .setEx(sessionInfoKey, expireSec, JSON.stringify(sessionInfo)),
        E.toError
      ),
      this.singleStringReplyAsync,
      this.falsyResponseToErrorAsync(
        new Error("Error setting user token info")
      ),
      TE.chain((_) =>
        pipe(
          TE.tryCatch(
            () =>
              this.redisClientSelector
                .selectOne(RedisClientMode.FAST)
                .sAdd(
                  `${userSessionsSetKeyPrefix}${fiscalCode}`,
                  sessionInfoKey
                ),
            E.toError
          ),
          this.integerReplyAsync(),
          this.falsyResponseToErrorAsync(
            new Error("Error updating user tokens info set")
          )
        )
      )
    );
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

  /**
   * Remove other user sessions and wallet tokens
   */
  private async removeOtherUserSessions(
    user: UserV5
  ): Promise<Either<Error, boolean>> {
    const errorOrSessionInfoKeys = await this.readSessionInfoKeys(
      user.fiscal_code
    );
    if (E.isRight(errorOrSessionInfoKeys)) {
      const oldSessionInfoKeys = errorOrSessionInfoKeys.right.filter(
        (_) =>
          _.startsWith(sessionInfoKeyPrefix) &&
          _ !== `${sessionInfoKeyPrefix}${user.session_token}`
      );
      // Generate old session keys list from session info keys list
      // transforming pattern SESSIONINFO-token into pattern SESSION-token with token as the same value
      const oldSessionKeys = oldSessionInfoKeys.map(
        (_) => `${sessionKeyPrefix}${_.split(sessionInfoKeyPrefix)[1]}`
      );

      // Retrieve all user data related to session tokens.
      // All the tokens are stored inside user payload.
      const errorOrSerializedUserV2 = await pipe(
        oldSessionInfoKeys,
        ROA.map((key) =>
          TE.tryCatch(
            () =>
              this.redisClientSelector.selectOne(RedisClientMode.FAST).get(key),
            E.toError
          )
        ),
        ROA.sequence(TE.ApplicativeSeq),
        // It's intended that some value can be null here
        this.arrayStringReplyAsync
      );

      // Deserialize all available user payloads and skip invalid one
      const errorOrDeserializedUsers = pipe(
        errorOrSerializedUserV2,
        E.map((_) =>
          _.map(this.parseUser)
            .filter(E.isRight)
            .map((deserializedUser) => deserializedUser.right)
        )
      );

      // Extract all tokens inside the user payload
      // If the value is invalid or must be skipped, it will be mapped with none
      const externalTokens = pipe(
        errorOrDeserializedUsers,
        E.mapLeft((_) => []),
        E.map((_) =>
          _.map((deserializedUser) =>
            pipe(
              this.getUserTokens(deserializedUser),
              R.filter(
                (p) =>
                  !(
                    p.prefix === sessionInfoKeyPrefix ||
                    p.prefix === sessionKeyPrefix
                  ) &&
                  !(
                    p.prefix === walletKeyPrefix &&
                    p.value === user.wallet_token
                  ) &&
                  !(
                    p.prefix === myPortalTokenPrefix &&
                    p.value === user.myportal_token
                  ) &&
                  !(
                    p.prefix === bpdTokenPrefix && p.value === user.bpd_token
                  ) &&
                  !(
                    p.prefix === zendeskTokenPrefix &&
                    p.value === user.zendesk_token
                  ) &&
                  !(p.prefix === fimsTokenPrefix && p.value === user.fims_token)
              ),
              R.collect((_1, { prefix, value }) => `${prefix}${value}`)
            )
          ).reduce((prev, tokens) => [...prev, ...tokens], [])
        ),
        E.toUnion
      );

      // Delete all active tokens that are different
      // from the new one generated and provided inside user object.
      const deleteOldKeysResponseV2 = await pipe(
        [...oldSessionInfoKeys, ...oldSessionKeys, ...externalTokens],
        TE.fromPredicate((keys) => keys.length === 0, identity),
        TE.fold(
          (keys) =>
            pipe(
              keys,
              ROA.map((singleKey) =>
                TE.tryCatch(
                  () =>
                    this.redisClientSelector
                      .selectOne(RedisClientMode.FAST)
                      .del(singleKey),
                  E.toError
                )
              ),
              ROA.sequence(TE.ApplicativeSeq),
              this.integerReplyAsync()
            ),
          (_) => TE.right(true)
        )
      )();
      await this.clearExpiredSetValues(user.fiscal_code);
      return deleteOldKeysResponseV2;
    }
    return errorOrSessionInfoKeys.left === sessionNotFoundError
      ? E.right(true)
      : E.left(errorOrSessionInfoKeys.left);
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
              sessions: [...prev.sessions, sessionInfo],
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
        value: user.session_token,
      },
      session_token: {
        prefix: sessionKeyPrefix,
        value: user.session_token,
      },
      wallet_token: {
        prefix: walletKeyPrefix,
        value: user.wallet_token,
      },
    };
    if (UserV5.is(user)) {
      return {
        ...requiredTokens,
        bpd_token: {
          prefix: bpdTokenPrefix,
          value: user.bpd_token,
        },
        fims_token: {
          prefix: fimsTokenPrefix,
          value: user.fims_token,
        },
        myportal_token: {
          prefix: myPortalTokenPrefix,
          value: user.myportal_token,
        },
        zendesk_token: {
          prefix: zendeskTokenPrefix,
          value: user.zendesk_token,
        },
      };
    }
    if (UserV4.is(user)) {
      return {
        ...requiredTokens,
        bpd_token: {
          prefix: bpdTokenPrefix,
          value: user.bpd_token,
        },
        myportal_token: {
          prefix: myPortalTokenPrefix,
          value: user.myportal_token,
        },
        zendesk_token: {
          prefix: zendeskTokenPrefix,
          value: user.zendesk_token,
        },
      };
    }
    if (UserV3.is(user)) {
      return {
        ...requiredTokens,
        bpd_token: {
          prefix: bpdTokenPrefix,
          value: user.bpd_token,
        },
        myportal_token: {
          prefix: myPortalTokenPrefix,
          value: user.myportal_token,
        },
      };
    }
    if (UserV2.is(user)) {
      return {
        ...requiredTokens,
        myportal_token: {
          prefix: myPortalTokenPrefix,
          value: user.myportal_token,
        },
      };
    }
    if (UserV1.is(user)) {
      return {
        ...requiredTokens,
      };
    }
    return assertUnreachable(user);
  }
}
