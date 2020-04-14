/**
 * This file contains methods for dealing with session tokens.
 */

import * as crypto from "crypto";

const DEFAULT_TOKEN_LENGTH_BYTES = 48;

export default class TokenService {
  /**
   * Generates a new random token.
   */
  public getNewToken(length: number = DEFAULT_TOKEN_LENGTH_BYTES): string {
    // Use the crypto.randomBytes as token.
    return crypto.randomBytes(length).toString("hex");
  }
}
