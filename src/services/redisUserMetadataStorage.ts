import * as redis from "redis";

import { Either, isLeft, isRight, left, right } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import { User } from "src/types/user";
import { UserMetadata } from "../../generated/backend/UserMetadata";
import { log } from "../utils/logger";
import { IUserMetadataStorage } from "./IUserMetadataStorage";

const userMetadataPrefix = "USERMETA-";
const metadataNotFoundError = new Error("User Metadata not found");

export default class RedisUserMetadataStorage implements IUserMetadataStorage {
  constructor(private readonly redisClient: redis.RedisClient) {}

  /**
   * {@inheritDoc}
   */
  public async set(
    user: User,
    payload: UserMetadata
  ): Promise<Either<Error, boolean>> {
    const getUserMetadataResult = await this.loadUserMetadataByFiscalCode(
      user.fiscal_code
    );
    if (
      isRight(getUserMetadataResult) &&
      getUserMetadataResult.value.version !== payload.version - 1
    ) {
      return left(new Error("Invalid version number"));
    }
    if (
      isLeft(getUserMetadataResult) &&
      getUserMetadataResult.value !== metadataNotFoundError
    ) {
      return left(getUserMetadataResult.value);
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
   * Parse the a Redis single string reply.
   *
   * @see https://redis.io/topics/protocol#simple-string-reply.
   */
  private singleStringReply(
    /* TODO: Rimuovere questo metodo perché duplicato,
    trovare stradigia per condividerlo tra
    RedisUserMetadataStorage e RedisSessionStorage
    */
    err: Error | null,
    reply: "OK" | undefined
  ): Either<Error, boolean> {
    if (err) {
      return left<Error, boolean>(err);
    }

    return right<Error, boolean>(reply === "OK");
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
                  "Unable to decode the user: %s",
                  ReadableReporter.report(errorOrDeserializedUserMetadata)
                );
                return resolve(
                  left<Error, UserMetadata>(
                    new Error("Unable to decode the user")
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
}
