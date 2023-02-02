import * as redis from "redis";
import RedisClustr = require("redis-clustr");
import * as appInsights from "applicationinsights";
import { pipe } from "fp-ts/lib/function";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as O from "fp-ts/lib/Option";
import { keyPrefixes } from "../services/redisSessionStorage";
import { log } from "./logger";

export function createSimpleRedisClient(redisUrl?: string): redis.RedisClient {
  const redisUrlOrDefault = redisUrl || "redis://redis";
  log.info("Creating SIMPLE redis client", { url: redisUrlOrDefault });
  return redis.createClient(redisUrlOrDefault);
}

export const offuscateTokensInfo = (message: string) =>
  pipe(
    keyPrefixes,
    RA.findFirst(key => message.includes(key)),
    O.map(key =>
      // eslint-disable-next-line no-useless-escape
      message.replace(new RegExp(`\\"${key}\\w+\\"`), `"${key}redacted"`)
    ),
    O.getOrElse(() => message)
  );

export const createClusterRedisClient = (
  appInsightsClient?: appInsights.TelemetryClient
) => (
  redisUrl: string,
  password?: string,
  port?: string
): redis.RedisClient => {
  const DEFAULT_REDIS_PORT = "6379";

  const redisPort: number = parseInt(port || DEFAULT_REDIS_PORT, 10);
  log.info("Creating CLUSTER redis client", { url: redisUrl });
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const redisClient = new RedisClustr({
    redisOptions: {
      auth_pass: password,
      tls: {
        servername: redisUrl
      }
    },
    servers: [
      {
        host: redisUrl,
        port: redisPort
      }
    ]
  }) as redis.RedisClient; // Casting RedisClustr with missing typings to RedisClient (same usage).
  redisClient.on("error", err => {
    log.error("[REDIS Error] an error occurs on redis client: %s", err);
    appInsightsClient?.trackEvent({
      name: "io-backend.redis.error",
      properties: {
        error: String(err),
        message:
          err instanceof Object ? offuscateTokensInfo(JSON.stringify(err)) : ""
      },
      tagOverrides: { samplingEnabled: "false" }
    });
  });
  redisClient.on(
    "reconnecting",
    ({
      delay,
      attempt
    }: {
      readonly delay: number;
      readonly attempt: number;
    }) => {
      log.warn(
        "[REDIS reconnecting] a reconnection events occurs [delay %s] [attempt %s]",
        delay,
        attempt
      );
      appInsightsClient?.trackEvent({
        name: "io-backend.redis.reconnecting",
        properties: {
          attempt,
          delay
        },
        tagOverrides: { samplingEnabled: "false" }
      });
    }
  );
  return redisClient;
};
