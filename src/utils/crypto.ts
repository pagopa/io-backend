import * as crypto from "crypto";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

/**
 * Returns hashed input based on sha256 algo
 */
export const sha256 = (s: string): NonEmptyString =>
  crypto
    .createHash("sha256")
    .update(s)
    .digest("hex") as NonEmptyString;

/**
 * Kindly imported from node-http-signature (https://github.com/eBay/digital-signature-nodejs-sdk/blob/main/lib/helpers/digest-helper.ts)
 */

export const constants = {
  BASE64: "base64",
  COLON: ":",
  CONTENT_DIGEST_SHA256: "sha-256=:",
  CONTENT_DIGEST_SHA512: "sha-512=:",
  SHA_256: "sha256",
  SHA_512: "sha512"
} as const;

/**
 * Generates the 'Content-Digest' header value for the input payload.
 *
 * @param {Buffer} payload The request payload.
 * @param {string} cipher The algorithm used to calculate the digest.
 * @returns {string} contentDigest The 'Content-Digest' header value.
 */
export const generateDigestHeader = (
  payload: Buffer | string,
  cipher: typeof constants.SHA_256 | typeof constants.SHA_512
): string => {
  // Validate the input payload
  if (!payload) {
    return "";
  }

  // Calculate the SHA-256 digest
  const hash = crypto
    .createHash(cipher)
    .update(payload)
    .digest(constants.BASE64);

  const algo: string =
    cipher === constants.SHA_512
      ? constants.CONTENT_DIGEST_SHA512
      : constants.CONTENT_DIGEST_SHA256;

  return algo + hash + constants.COLON;
};

/**
 * Validates the 'Content-Digest' header value.
 *
 * @param {string} contentDigestHeader The Content-Digest header value.
 * @param {Buffer} body The HTTP request body.
 * @throws {Error} If the Content-Digest header value is invalid.
 */
export const validateDigestHeader = (
  contentDigestHeader: string,
  body: Buffer | string
): void => {
  if (!contentDigestHeader) {
    throw new Error("Content-Digest header missing");
  }

  // Validate
  const contentDigestPattern = new RegExp("(.+)=:(.+):");
  const contentDigestParts = contentDigestPattern.exec(contentDigestHeader);
  if (!contentDigestParts || contentDigestParts.length === 0) {
    throw new Error("Content-digest header invalid");
  }
  const cipher: string = contentDigestParts[1];

  if (cipher !== "sha-256" && cipher !== "sha-512") {
    throw new Error("Invalid cipher " + cipher);
  }

  const algorithm =
    cipher === "sha-256" ? constants.SHA_256 : constants.SHA_512;
  const newDigest: string = generateDigestHeader(body, algorithm);

  if (newDigest !== contentDigestHeader) {
    throw new Error(
      "Content-Digest value is invalid. Expected body digest is: " + newDigest
    );
  }
};
