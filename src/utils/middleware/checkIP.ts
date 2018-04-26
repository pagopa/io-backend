/**
 * An Express middleware that checks if source IP falls into a CIDR range.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import { CIDR, IPString } from "italia-ts-commons/lib/strings";
import * as rangeCheck from "range_check";
import * as requestIp from "request-ip";

export default function checkIP(
  range: CIDR
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
    const clientIp = requestIp.getClientIp(req);
    const errorOrIPString = IPString.decode(clientIp);

    if (isLeft(errorOrIPString)) {
      res.status(400).send("Bad request");
    } else {
      const IP = errorOrIPString.value;
      if (!rangeCheck.inRange(IP, range)) {
        res.status(401).send("Unauthorized");
      } else {
        next();
      }
    }
  };
}
