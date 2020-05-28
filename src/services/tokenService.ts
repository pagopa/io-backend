/**
 * This file contains methods for dealing with session tokens.
 */

import * as crypto from "crypto";
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
}
