import * as redis from "redis";
import * as E from "fp-ts/lib/Either";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { Either } from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { parse } from "fp-ts/lib/Json";
import { flow, pipe } from "fp-ts/lib/function";
import { UserMetadata } from "../../generated/backend/UserMetadata";
import { User } from "../types/user";
import { log } from "../utils/logger";
import { IUserMetadataStorage } from "./IUserMetadataStorage";
import RedisStorageUtils from "./redisStorageUtils";

const userMetadataPrefix = "USERMETA-";
export const metadataNotFoundError = new Error("User Metadata not found");
export const invalidVersionNumberError = new Error("Invalid version number");

/**
 * Service that manages user metadata stored into Redis database.
 */

export default class RedisUserMetadataStorage
  extends RedisStorageUtils
  implements IUserMetadataStorage
{
  constructor(
    private readonly redisClient: redis.RedisClientType | redis.RedisClusterType
  ) {
    super();
  }

  /**
   * {@inheritDoc}
   *
   * This method doesn't support atomic operations on concurrency scenario.
   * Story https://www.pivotaltracker.com/story/show/167064659
   */
  public async set(
    user: User,
    payload: UserMetadata
  ): Promise<Either<Error, boolean>> {
    const getUserMetadataResult = await this.loadUserMetadataByFiscalCode(
      user.fiscal_code
    );
    if (
      E.isRight(getUserMetadataResult) &&
      getUserMetadataResult.right.version !== payload.version - 1
    ) {
      return E.left(invalidVersionNumberError);
    }
    if (
      E.isLeft(getUserMetadataResult) &&
      getUserMetadataResult.left !== metadataNotFoundError
    ) {
      return E.left(getUserMetadataResult.left);
    }
    return pipe(
      TE.tryCatch(
        () =>
          this.redisClient.set(
            `${userMetadataPrefix}${user.fiscal_code}`,
            JSON.stringify(payload)
          ),
        E.toError
      ),
      this.singleStringReplyAsync
    )();
  }

  /**
   * {@inheritDoc}
   */
  public async get(user: User): Promise<Either<Error, UserMetadata>> {
    return this.loadUserMetadataByFiscalCode(user.fiscal_code);
  }

  /**
   * Delete all user metdata
   *
   * {@inheritDoc}
   */
  public del(fiscalCode: FiscalCode): Promise<Either<Error, true>> {
    return pipe(
      TE.tryCatch(() => {
        log.info(`Deleting metadata for ${fiscalCode}`);
        return this.redisClient.del(`${userMetadataPrefix}${fiscalCode}`);
      }, E.toError),
      TE.map<number, true>(() => true)
    )();
  }

  private loadUserMetadataByFiscalCode(
    fiscalCode: string
  ): Promise<Either<Error, UserMetadata>> {
    return pipe(
      TE.tryCatch(
        () => this.redisClient.get(`${userMetadataPrefix}${fiscalCode}`),
        () => new Error("REDIS CLIENT ERROR")
      ),
      TE.chain(
        flow(
          O.fromNullable,
          TE.fromOption(() => metadataNotFoundError)
        )
      ),
      TE.chain(
        flow(
          parse,
          E.mapLeft(() => new Error("Unable to parse the user metadata json")),
          TE.fromEither,
          TE.chain(
            flow(
              UserMetadata.decode,
              TE.fromEither,
              TE.mapLeft((err) => {
                log.error(
                  "Unable to decode the user metadata: %s",
                  errorsToReadableMessages(err).join("|")
                );
                return new Error("Unable to decode the user metadata");
              })
            )
          )
        )
      )
    )();
  }
}
