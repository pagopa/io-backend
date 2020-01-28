import * as redis from "redis";

import { Either, isLeft, left, right, toError } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import { UserMetadata } from "../../generated/backend/UserMetadata";
import { User } from "../types/user";
import { log } from "../utils/logger";
import { IUserMetadataStorage } from "./IUserMetadataStorage";
import RedisStorageUtils from "./redisStorageUtils";

import { Sema } from "async-sema";
import {
  fromEither,
  fromPredicate,
  taskify,
  tryCatch
} from "fp-ts/lib/TaskEither";
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
  private setOperations: Set<string> = new Set();
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
  public async set(
    user: User,
    payload: UserMetadata
  ): Promise<Either<Error, boolean>> {
    // In order to work properly, optimistic lock needs to be initialized on different
    // redis client instances @see https://github.com/NodeRedis/node_redis/issues/1320#issuecomment-373200541
    await this.mutex.acquire();
    const raceCondition = this.setOperations.has(user.fiscal_code);
    // tslint:disable-next-line: no-let
    let duplicatedOrOriginalRedisClient = this.redisClient;
    if (raceCondition === false) {
      this.setOperations.add(user.fiscal_code);
    } else {
      // A duplicate redis client must be created only if the main client is already
      // in use into an optimistic lock update on the same key
      duplicatedOrOriginalRedisClient = this.redisClient.duplicate();
    }
    this.mutex.release();
    const userMetadataWatchResult = await taskify(
      (key: string, callback: (err: Error | null, value: true) => void) => {
        duplicatedOrOriginalRedisClient.watch(key, err => callback(err, true));
      }
    )(`${userMetadataPrefix}${user.fiscal_code}`)
      .chain(() =>
        tryCatch(
          () => this.loadUserMetadataByFiscalCode(user.fiscal_code),
          toError
        )
      )
      .chain(_ => {
        if (isLeft(_) && _.value === metadataNotFoundError) {
          return fromEither(
            right({
              metadata: "",
              version: 0
            })
          );
        }
        return fromEither(_);
      })
      .chain(
        fromPredicate(
          _ => _.version === payload.version - 1,
          _ => invalidVersionNumberError
        )
      )
      .chain(() =>
        taskify(
          (
            key: string,
            data: string,
            callback: (
              err: Error | null,
              value?: Either<Error, boolean>
            ) => void
          ) => {
            duplicatedOrOriginalRedisClient
              .multi()
              .set(key, data)
              .exec((err, results) => {
                if (err) {
                  return callback(err);
                }
                if (results === null) {
                  return callback(concurrentWriteRejectionError);
                }
                callback(null, this.singleStringReply(err, results[0]));
              });
          }
        )(`${userMetadataPrefix}${user.fiscal_code}`, JSON.stringify(payload))
      )
      .chain(fromEither)
      .run();
    raceCondition
      ? duplicatedOrOriginalRedisClient.end(true)
      : await this.resetOperation(user.fiscal_code);
    return userMetadataWatchResult;
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
    this.setOperations.delete(fiscalCode);
    this.mutex.release();
  }
}
