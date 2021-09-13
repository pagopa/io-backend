import * as redis from "redis";

import * as E from "fp-ts/lib/Either";
import { ReadableReporter } from "@pagopa/ts-commons/lib/reporters";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { Either } from "fp-ts/lib/Either";
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
export default class RedisUserMetadataStorage extends RedisStorageUtils
  implements IUserMetadataStorage {
  constructor(private readonly redisClient: redis.RedisClient) {
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
    return await new Promise<Either<Error, boolean>>(resolve => {
      // Set key to hold the string value. If key already holds a value, it is overwritten, regardless of its type.
      // @see https://redis.io/commands/set
      this.redisClient.set(
        `${userMetadataPrefix}${user.fiscal_code}`,
        JSON.stringify(payload),
        (err, response) => resolve(this.singleStringReply(err, response))
      );
    });
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
    return new Promise<Either<Error, true>>(resolve => {
      log.info(`Deleting metadata for ${fiscalCode}`);
      this.redisClient.del(`${userMetadataPrefix}${fiscalCode}`, err => {
        if (err) {
          resolve(E.left(err));
        } else {
          resolve(E.right(true));
        }
      });
    });
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
            resolve(E.left(err || metadataNotFoundError));
          } else {
            // Try-catch is needed because parse() may throw an exception.
            try {
              const metadataPayload = JSON.parse(response);
              const errorOrDeserializedUserMetadata = UserMetadata.decode(
                metadataPayload
              );

              if (E.isLeft(errorOrDeserializedUserMetadata)) {
                log.error(
                  "Unable to decode the user metadata: %s",
                  ReadableReporter.report(errorOrDeserializedUserMetadata)
                );
                return resolve(
                  E.left<Error, UserMetadata>(
                    new Error("Unable to decode the user metadata")
                  )
                );
              }
              const userMetadata = errorOrDeserializedUserMetadata.right;
              return resolve(E.right<Error, UserMetadata>(userMetadata));
            } catch (_) {
              return resolve(
                E.left<Error, UserMetadata>(
                  new Error("Unable to parse the user metadata json")
                )
              );
            }
          }
        }
      );
    });
  }
}
