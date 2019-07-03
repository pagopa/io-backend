import { Either, left, right } from "fp-ts/lib/Either";
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
    // tslint:disable-next-line:no-any
    reply: unknown
  ): Either<Error, boolean> {
    if (err) {
      return left<Error, boolean>(err);
    }

    return right<Error, boolean>(isNumber(reply));
  }
}
