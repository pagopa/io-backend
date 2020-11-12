/**
 * This file contains methods for dealing with session tokens.
 */

import * as crypto from "crypto";
import { toError } from "fp-ts/lib/Either";
import { TaskEither, taskify } from "fp-ts/lib/TaskEither";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import * as jwt from "jsonwebtoken";
import { ulid } from "ulid";
import { promisify } from "util";

const asyncRandomBytes = promisify(crypto.randomBytes);

export default class TokenService {
  /**
   * Generates a new random token.
   */
  public getNewToken(length: number): string {
    // Use the crypto.randomBytes as token.
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Generates a new random token.
   */
  public getNewTokenAsync(length: number): Promise<string> {
    // Use the crypto.randomBytes as token.
    return asyncRandomBytes(length).then(_ => _.toString("hex"));
  }

  public getJwtSupportToken(
    privateKey: NonEmptyString,
    fiscalCode: FiscalCode,
    tokenTtl: NonNegativeInteger,
    issuer: NonEmptyString
  ): TaskEither<Error, string> {
    return taskify<Error, string>(cb =>
      jwt.sign(
        { fiscalCode },
        privateKey,
        {
          algorithm: "RS256",
          expiresIn: `${tokenTtl} seconds`,
          issuer,
          jwtid: ulid()
        },
        cb
      )
    )().mapLeft(toError);
  }
}
