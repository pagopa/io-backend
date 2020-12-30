/**
 * An Express middleware that checks if source IP falls into a CIDR range.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import { readableReport } from "italia-ts-commons/lib/reporters";
import { CIDR, IPString } from "italia-ts-commons/lib/strings";
import * as rangeCheck from "range_check";
import { log } from "../logger";

export default function checkIP(
  range: readonly CIDR[]
): (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // when the boolean flag "trust proxy" is enabled
    // express takes this from the leftmost value
    // contained in the x-forwarded-for header
    const errorOrIPString = IPString.decode(req.ip).alt(
      IPString.decode(req.connection.remoteAddress)
    );

    if (isLeft(errorOrIPString)) {
      log.error(
        `Cannot decode source IP: (req.ip=${req.ip},remoteAddress=${
          req.connection.remoteAddress
        },error=${readableReport(errorOrIPString.value)}.`
      );
      res.status(400).send("Bad request");
    } else {
      const IP = errorOrIPString.value;
      // tslint:disable-next-line: readonly-array
      if (!rangeCheck.inRange(IP, range as CIDR[])) {
        log.error(`Blocked source IP ${IP}.`);
        res.status(401).send("Unauthorized");
      } else {
        next();
      }
    }
  };
}
