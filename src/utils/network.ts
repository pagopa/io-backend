import { CIDR, IPString } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import { Either } from "fp-ts/lib/Either";
import { Errors, array } from "io-ts";

/**
 * Parse a comma separated string of CIDR(s) or IP(s) into an array
 */
export function decodeCIDRs(cidrs?: string): Either<Errors, readonly CIDR[]> {
  return array(CIDR).decode(
    cidrs
      // may be a comma separated list of CIDR(s) or IP(s)
      ?.split(",")
      .map((c) => c.trim())
      // if we read a plain IP then append '/32'
      .map((c) => (c.indexOf("/") !== -1 ? c : c + "/32")),
  );
}

/**
 * Validate the `ip` value into the express Request.
 * When the boolean flag "trust proxy" is enabled
 * express takes this from the leftmost value
 * contained in the x-forwarded-for header
 */
export const decodeIPAddressFromReq = (
  req: express.Request,
): Either<Errors, IPString> => IPString.decode(req.ip);
