import { isNumber } from "util";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";

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
      return E.left(err);
    }

    return E.right(reply === "OK");
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
      return E.left(err);
    }
    if (expectedReply !== undefined && expectedReply !== reply) {
      return E.right(false);
    }
    return E.right(isNumber(reply));
  }

  protected falsyResponseToError(
    response: Either<Error, boolean>,
    error: Error
  ): Either<Error, true> {
    if (E.isLeft(response)) {
      return E.left(response.left);
    } else {
      if (response.right) {
        return E.right(true);
      }
      return E.left(error);
    }
  }
}
