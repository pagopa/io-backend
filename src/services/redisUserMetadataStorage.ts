import * as redis from "redis";

import { Either, isLeft, isRight, left, right } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import { UserMetadata } from "../../generated/backend/UserMetadata";
import { User } from "../types/user";
import { log } from "../utils/logger";
import { IUserMetadataStorage } from "./IUserMetadataStorage";
import RedisStorageUtils from "./redisStorageUtils";

import { Sema } from "async-sema";
import { FiscalCode } from "italia-ts-commons/lib/strings";

const userMetadataPrefix = "USERMETA-";
export const metadataNotFoundError = new Error("User Metadata not found");
export const invalidVersionNumberError = new Error("Invalid version number");
export const concurrentWriteRejectionError = new Error(
  "Concurrent write operation"
);

/**
 * Service that manages user metadata stored into Redis database.
 */
export default class RedisUserMetadataStorage extends RedisStorageUtils
  implements IUserMetadataStorage {
  private setOperations: Record<string, true | undefined> = {};
  private mutex: Sema = new Sema(1);
  constructor(private readonly redisClient: redis.RedisClient) {
    super();
  }

  /**
   * {@inheritDoc}
   * This method uses Optimistic Lock to prevent race condition
   * during write operations of user metadata
   * @see https://github.com/NodeRedis/node_redis#optimistic-locks
   */
  // tslint:disable-next-line: cognitive-complexity
  public async set(
    user: User,
    payload: UserMetadata
  ): Promise<Either<Error, boolean>> {
    // In order to work properly, optimistic lock needs to be initialized on different
    // redis client instances @see https://github.com/NodeRedis/node_redis/issues/1320#issuecomment-373200541
    await this.mutex.acquire();
    const raceCondition = this.setOperations[user.fiscal_code];
    // tslint:disable-next-line: no-let
    let duplicatedOrOriginalRedisClient = this.redisClient;
    if (raceCondition === undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.setOperations[user.fiscal_code] = true;
    } else {
      duplicatedOrOriginalRedisClient = this.redisClient.duplicate();
    }
    this.mutex.release();
    const userMetadataWatchResult = await new Promise<Either<Error, true>>(
      resolve => {
        duplicatedOrOriginalRedisClient.watch(
          `${userMetadataPrefix}${user.fiscal_code}`,
          err => {
            if (err) {
              return resolve(left(err));
            }
            resolve(right(true));
          }
        );
      }
    );
    if (isLeft(userMetadataWatchResult)) {
      raceCondition
        ? duplicatedOrOriginalRedisClient.end(true)
        : await this.resetOperation(user.fiscal_code);
      return userMetadataWatchResult;
    }
    const getUserMetadataResult = await this.loadUserMetadataByFiscalCode(
      user.fiscal_code
    );
    if (
      isRight(getUserMetadataResult) &&
      getUserMetadataResult.value.version !== payload.version - 1
    ) {
      raceCondition
        ? duplicatedOrOriginalRedisClient.end(true)
        : await this.resetOperation(user.fiscal_code);
      return left(invalidVersionNumberError);
    }
    if (
      isLeft(getUserMetadataResult) &&
      getUserMetadataResult.value !== metadataNotFoundError
    ) {
      raceCondition
        ? duplicatedOrOriginalRedisClient.end(true)
        : await this.resetOperation(user.fiscal_code);
      return left(getUserMetadataResult.value);
    }
    return await new Promise<Either<Error, boolean>>(resolve => {
      duplicatedOrOriginalRedisClient
        .multi()
        .set(
          `${userMetadataPrefix}${user.fiscal_code}`,
          JSON.stringify(payload)
        )
        .exec(async (err, results) => {
          raceCondition
            ? duplicatedOrOriginalRedisClient.end(true)
            : await this.resetOperation(user.fiscal_code);
          if (err) {
            return resolve(left(err));
          }
          if (results === null) {
            return resolve(left(concurrentWriteRejectionError));
          }
          resolve(this.singleStringReply(err, results[0]));
        });
    });
  }

  /**
   * {@inheritDoc}
   */
  public async get(user: User): Promise<Either<Error, UserMetadata>> {
    return this.loadUserMetadataByFiscalCode(user.fiscal_code);
  }

  private loadUserMetadataByFiscalCode(
    fiscalCode: string
  ): Promise<Either<Error, UserMetadata>> {
    return new Promise<Either<Error, UserMetadata>>(resolve => {
      // Set key to hold the string value. If key already holds a value, it is overwritten, regardless of its type.
      // @see https://redis.io/commands/set
      this.redisClient.get(
        `${userMetadataPrefix}${fiscalCode}`,
        (err, response) => {
          if (err || response === null) {
            resolve(left(err || metadataNotFoundError));
          } else {
            // Try-catch is needed because parse() may throw an exception.
            try {
              const metadataPayload = JSON.parse(response);
              const errorOrDeserializedUserMetadata = UserMetadata.decode(
                metadataPayload
              );

              if (isLeft(errorOrDeserializedUserMetadata)) {
                log.error(
                  "Unable to decode the user metadata: %s",
                  ReadableReporter.report(errorOrDeserializedUserMetadata)
                );
                return resolve(
                  left<Error, UserMetadata>(
                    new Error("Unable to decode the user metadata")
                  )
                );
              }
              const userMetadata = errorOrDeserializedUserMetadata.value;
              return resolve(right<Error, UserMetadata>(userMetadata));
            } catch (err) {
              return resolve(
                left<Error, UserMetadata>(
                  new Error("Unable to parse the user metadata json")
                )
              );
            }
          }
        }
      );
    });
  }

  private async resetOperation(fiscalCode: FiscalCode): Promise<void> {
    await this.mutex.acquire();
    // tslint:disable-next-line: no-object-mutation
    this.setOperations[fiscalCode] = undefined;
    this.mutex.release();
  }
}
