import { isNumber } from "util";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

export default class RedisStorageUtils {
  /**
   * Parse a Redis single string reply.
   *
   * @see https://redis.io/topics/protocol#simple-string-reply.
   * @deprecated
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

  protected singleStringReplyAsync(
    command: TE.TaskEither<Error, string | null>
  ) {
    return pipe(
      command,
      TE.map(reply => reply === "OK")
    );
  }

  /**
   * Parse a Redis integer reply.
   *
   * @see https://redis.io/topics/protocol#integer-reply
   * @deprecated
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

  protected integerReplyAsync(expectedReply?: number) {
    return (
      command: TE.TaskEither<Error, unknown>
    ): TE.TaskEither<Error, boolean> =>
      pipe(
        command,
        TE.chain(reply => {
          if (expectedReply !== undefined && expectedReply !== reply) {
            return TE.right(false);
          }
          return TE.right(isNumber(reply));
        })
      );
  }

  /**
   *
   * @deprecated
   */
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

  protected falsyResponseToErrorAsync(error: Error) {
    return (
      response: TE.TaskEither<Error, boolean>
    ): TE.TaskEither<Error, true> =>
      pipe(
        response,
        TE.chain(_ => (_ ? TE.right(_) : TE.left(error)))
      );
  }
}
