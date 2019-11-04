import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { isNumber } from "util";

export default class RedisStorageUtils {
  /**
   * Parse a Redis single string reply.
   *
   * @see https://redis.io/topics/protocol#simple-string-reply.
   */
  protected singleStringReply(
    err: Error | null,
    reply: "OK" | undefined
  ): Either<Error, boolean> {
    if (err) {
      return left<Error, boolean>(err);
    }

    return right<Error, boolean>(reply === "OK");
  }

  /**
   * Parse a Redis integer reply.
   *
   * @see https://redis.io/topics/protocol#integer-reply
   */
  protected integerReply(
    err: Error | null,
    reply: unknown,
    expectedReply?: number
  ): Either<Error, boolean> {
    if (err) {
      return left<Error, boolean>(err);
    }
    if (expectedReply !== undefined && expectedReply !== reply) {
      return right<Error, boolean>(false);
    }
    return right<Error, boolean>(isNumber(reply));
  }

  protected falsyResponseToError(
    response: Either<Error, boolean>,
    error: Error
  ): Either<Error, true> {
    if (isLeft(response)) {
      return left(response.value);
    } else {
      if (response.value) {
        return right(true);
      }
      return left(error);
    }
  }
}
