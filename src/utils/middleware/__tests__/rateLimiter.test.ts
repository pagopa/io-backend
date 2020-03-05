import { RateLimiterMemory } from "rate-limiter-flexible";
import mockReq from "../../../__mocks__/request";
import mockRes from "../../../__mocks__/response";
import { makeRateLimiterMiddleware } from "../rateLimiter";

import * as rip from "request-ip";
jest.spyOn(rip, "getClientIp").mockReturnValue("127.0.0.1");

describe("Rate limiter middleware", () => {
  it("should apply rate limit and return 429 if limit is reached", async () => {
    const rateLimiterMiddleware = makeRateLimiterMiddleware(
      new RateLimiterMemory({
        duration: 1,
        points: 1
      })
    );
    const next = jest.fn();
    const aResponse = mockRes();
    await rateLimiterMiddleware(mockReq(), aResponse, next);
    await rateLimiterMiddleware(mockReq(), aResponse, next);
    expect(aResponse.set).toHaveBeenCalledWith("Retry-After", "1");
    expect(aResponse.status).toHaveBeenCalledWith(429);
  });
  it("should NOT apply rate limit if limit is NOT reached", async () => {
    const rateLimiterMiddleware = makeRateLimiterMiddleware(
      new RateLimiterMemory({
        duration: 1,
        points: 2
      })
    );
    const next = jest.fn();
    const aResponse = mockRes();
    await rateLimiterMiddleware(mockReq(), aResponse, next);
    await rateLimiterMiddleware(mockReq(), aResponse, next);
    expect(aResponse.set).toHaveBeenCalledWith("X-RateLimit-Remaining", "1");
    expect(aResponse.status).not.toHaveBeenCalledWith(429);
  });
});
