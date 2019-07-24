import * as redis from "redis";
import RedisClustr = require("redis-clustr");
import { getRequiredENVVar } from "./container";
import { log } from "./logger";

export function createSimpleRedisClient(): redis.RedisClient {
  const redisUrl = process.env.REDIS_URL || "redis://redis";
  log.info("Creating SIMPLE redis client", { url: redisUrl });
  return redis.createClient(redisUrl);
}

export function createClusterRedisClient(): redis.RedisClient {
  const DEFAULT_REDIS_PORT = "6379";

  const redisUrl = getRequiredENVVar("REDIS_URL");
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisPort: number = parseInt(
    process.env.REDIS_PORT || DEFAULT_REDIS_PORT,
    10
  );
  log.info("Creating CLUSTER redis client", { url: redisUrl });
  return new RedisClustr({
    redisOptions: {
      auth_pass: redisPassword,
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
}
