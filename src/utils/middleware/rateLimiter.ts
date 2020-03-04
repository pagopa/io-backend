import { NextFunction, Request, Response } from "express";
import { RateLimiterStoreAbstract } from "rate-limiter-flexible";
import * as requestIp from "request-ip";

import { ProblemJson } from "italia-ts-commons/lib/responses";
import { log } from "../../utils/logger";

export const makeRateLimiterMiddleware = (
  rateLimiter: RateLimiterStoreAbstract
) => async (req: Request, res: Response, next: NextFunction) => {
  const ip = requestIp.getClientIp(req);
  try {
    const rl = await rateLimiter.consume(ip);
    res
      .set("X-RateLimit-Remaining", rl.remainingPoints.toString())
      .set(
        "X-RateLimit-Reset",
        new Date(Date.now() + Number(rl.msBeforeNext)).toString()
      )
      .set(
        "X-RateLimit-Limit",
        (Number(rl.remainingPoints) + Number(rl.consumedPoints)).toString()
      );
    next();
  } catch (_) {
    const retryAfter = Math.ceil(_.msBeforeNext / 1000);
    const problem: ProblemJson = {
      detail: "Rate limit reached",
      status: 429,
      title: "Too Many requests"
    };
    log.warn("Rate limiter is blocking ip (%s)", ip);
    res
      .set("X-RateLimit-Remaining", _.remainingPoints.toString())
      .set(
        "X-RateLimit-Reset",
        new Date(Date.now() + Number(_.msBeforeNext)).toString()
      )
      .set(
        "X-RateLimit-Limit",
        (Number(_.remainingPoints) + Number(_.consumedPoints)).toString()
      )
      .set("Retry-After", retryAfter.toString())
      .status(429)
      .json(problem);
  }
};
