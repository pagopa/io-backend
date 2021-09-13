/**
 * An Express middleware that checks if source IP falls into a CIDR range.
 */

import * as express from "express";
import * as E from "fp-ts/lib/Either";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { CIDR, IPString } from "@pagopa/ts-commons/lib/strings";
import * as rangeCheck from "range_check";
import { pipe } from "fp-ts/lib/function";
import { log } from "../logger";

export default function checkIP(
  range: ReadonlyArray<CIDR>
): (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    // when the boolean flag "trust proxy" is enabled
    // express takes this from the leftmost value
    // contained in the x-forwarded-for header
    const errorOrIPString = pipe(
      IPString.decode(req.ip),
      E.alt(() =>
        // use x-client-ip instead of x-forwarded-for
        // for internal calls (same vnet)
        IPString.decode(req.headers["x-client-ip"])
      )
    );

    if (E.isLeft(errorOrIPString)) {
      log.error(
        `Cannot decode source IP: (req.ip=${req.ip},x-client-ip=${
          req.headers["x-client-ip"]
        },error=${readableReport(errorOrIPString.left)}.`
      );
      res.status(400).send("Bad request");
    } else {
      const IP = errorOrIPString.right;
      if (!rangeCheck.inRange(IP, Array.from(range))) {
        log.error(`Blocked source IP ${IP}.`);
        res.status(401).send("Unauthorized");
      } else {
        next();
      }
    }
  };
}
