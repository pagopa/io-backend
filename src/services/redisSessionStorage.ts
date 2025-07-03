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
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as B from "fp-ts/lib/boolean";
import { flow, identity, pipe } from "fp-ts/lib/function";
import { isArray } from "util";

import { AssertionRef as BackendAssertionRef } from "../../generated/auth/AssertionRef";
import { SessionInfo } from "../../generated/auth/SessionInfo";
import { SessionsList } from "../../generated/auth/SessionsList";
import {
  LollipopData,
  NullableBackendAssertionRefFromString
} from "../types/assertionRef";
import {
  BPDToken,
  FIMSToken,
  MyPortalToken,
  SessionToken,
  WalletToken,
  ZendeskToken
} from "../types/token";
import { User } from "../types/user";
import { LoginTypeEnum } from "../utils/fastLogin";
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
}
