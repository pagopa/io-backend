/**
 * This file contains methods for dealing with session tokens.
 */

import * as crypto from "crypto";
import { promisify } from "util";
import { toError } from "fp-ts/lib/Either";
import { TaskEither, taskify } from "fp-ts/lib/TaskEither";
import {
  EmailString,
  FiscalCode,
  NonEmptyString
} from "italia-ts-commons/lib/strings";
import { Second } from "italia-ts-commons/lib/units";
import * as jwt from "jsonwebtoken";
import { ulid } from "ulid";

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

  /**
   * Generates a new support token containing the logged user's fiscalCode.
   *
   * @param privateKey: The RSA's private key used to sign this JWT token
   * @param fiscalCode: The logged user's FiscalCode
   * @param tokenTtl: Token Time To live (expressed in seconds)
   * @param issuer: The Token issuer
   */
  public getJwtSupportToken(
    privateKey: NonEmptyString,
    fiscalCode: FiscalCode,
    tokenTtl: Second,
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

  /**
   * Generates a new zendesk support token containing the logged user's fiscalCode and email address.
   *
   * @param secret: The shared secret used to sign this JWT token
   * @param name: The logged user's first name
   * @param familyName: The logged user's last name
   * @param fiscalCode: The logged user's fiscal code
   * @param emailAddress: The logged user's email address
   * @param tokenTtl: Token Time To live (expressed in seconds)
   * @param issuer: The Token issuer
   */
  // eslint-disable-next-line max-params
  public getJwtZendeskSupportToken(
    secret: NonEmptyString,
    name: NonEmptyString,
    familyName: NonEmptyString,
    fiscalCode: FiscalCode,
    emailAddress: EmailString,
    tokenTtl: Second,
    issuer: NonEmptyString
  ): TaskEither<Error, string> {
    return taskify<Error, string>(cb =>
      jwt.sign(
        {
          email: emailAddress,
          external_id: fiscalCode,
          iat: new Date().getTime() / 1000,
          jti: ulid(),
          name: `${name} ${familyName}`
        },
        secret,
        {
          algorithm: "HS256",
          expiresIn: `${tokenTtl} seconds`,
          issuer
        },
        cb
      )
    )().mapLeft(toError);
  }

  /**
   * Generates a new Mit voucher token containing the logged user's fiscalCode.
   *
   * @param privateKey: The RSA's private key used to sign this JWT token
   * @param fiscalCode: The logged user's FiscalCode
   * @param tokenTtl: Token Time To live (expressed in seconds)
   * @param issuer: The Token issuer
   * @param audience: The Token audience
   */
  public getJwtMitVoucherToken(
    privateKey: NonEmptyString,
    fiscalCode: FiscalCode,
    tokenTtl: Second,
    issuer: NonEmptyString,
    audience: NonEmptyString
  ): TaskEither<Error, string> {
    return taskify<Error, string>(cb =>
      jwt.sign(
        {},
        privateKey,
        {
          algorithm: "ES256",
          audience,
          expiresIn: `${tokenTtl} seconds`,
          issuer,
          subject: fiscalCode
        },
        cb
      )
    )().mapLeft(toError);
  }

  /**
   * Generates a new PEC-SERVER support token containing the logged user's fiscalCode.
   *
   * @param secret: The shared secret used to sign this JWT token
   * @param fiscalCode: The logged user's fiscal code
   */
  public getPecServerTokenHandler(
    fiscalCode: FiscalCode,
    secret: NonEmptyString
  ): () => TaskEither<Error, string> {
    return taskify<Error, string>(cb =>
      jwt.sign(
        {
          account: fiscalCode
        },
        secret,
        {
          algorithm: "HS256",
          noTimestamp: true
        },
        cb
      )
    );
  }
}
