/**
 * This file contains methods for dealing with session tokens.
 */

import * as crypto from "crypto";

export default class TokenService {
  /**
   * Generates a new random token.
   */
  public getNewToken(): string {
    // Use the crypto.randomBytes as token.
    const SESSION_TOKEN_LENGTH_BYTES = 48;
    return crypto.randomBytes(SESSION_TOKEN_LENGTH_BYTES).toString("hex");
  }
}
