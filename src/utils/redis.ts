import * as redis from "redis";
import RedisClustr = require("redis-clustr");
import { log } from "./logger";

export function createSimpleRedisClient(redisUrl?: string): redis.RedisClient {
  const redisUrlOrDefault = redisUrl || "redis://redis";
  log.info("Creating SIMPLE redis client", { url: redisUrlOrDefault });
  return redis.createClient(redisUrlOrDefault);
}

export function createClusterRedisClient(
  redisUrl: string,
  password?: string,
  port?: string
): redis.RedisClient {
  const DEFAULT_REDIS_PORT = "6379";

  const redisPort: number = parseInt(port || DEFAULT_REDIS_PORT, 10);
  log.info("Creating CLUSTER redis client", { url: redisUrl });
  return new RedisClustr({
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
}
