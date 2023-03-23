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