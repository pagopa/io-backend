import * as redis from "redis";
import * as appInsights from "applicationinsights";
import { pipe } from "fp-ts/lib/function";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as O from "fp-ts/lib/Option";
import { keyPrefixes } from "../services/redisSessionStorage";
import { log } from "./logger";

export const obfuscateTokensInfo = (message: string) =>
  pipe(
    keyPrefixes,
    RA.findFirst((key) => message.includes(key)),
    O.map((key) =>
      // eslint-disable-next-line no-useless-escape
      message.replace(new RegExp(`\\"${key}\\w+\\"`), `"${key}redacted"`)
    ),
    O.getOrElse(() => message)
  );

export const createClusterRedisClient =
  (
    enableTls: boolean,
    appInsightsClient?: appInsights.TelemetryClient,
    useReplicas: boolean = true
  ) =>
  async (
    redisUrl: string,
    password?: string,
    port?: string
  ): Promise<redis.RedisClusterType> => {
    const DEFAULT_REDIS_PORT = enableTls ? "6380" : "6379";
    const prefixUrl = enableTls ? "rediss://" : "redis://";
    const completeRedisUrl = `${prefixUrl}${redisUrl}`;

    const redisPort: number = parseInt(port || DEFAULT_REDIS_PORT, 10);
    log.info("Creating CLUSTER redis client", { url: completeRedisUrl });

    const redisClient = redis.createCluster<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>
    >({
      defaults: {
        legacyMode: false,
        password,
        socket: {
          // TODO: We can add a whitelist with all the IP addresses of the redis clsuter
          checkServerIdentity: (_hostname, _cert) => undefined,
          keepAlive: 2000,
          tls: enableTls,
        },
      },
      rootNodes: [
        {
          url: `${completeRedisUrl}:${redisPort}`,
        },
      ],
      useReplicas,
    });
    redisClient.on("error", (err) => {
      log.error("[REDIS Error] an error occurs on redis client: %s", err);
      appInsightsClient?.trackEvent({
        name: "io-backend.redis.error",
        properties: {
          error: String(err),
          message:
            err instanceof Object
              ? obfuscateTokensInfo(JSON.stringify(err))
              : "",
        },
        tagOverrides: { samplingEnabled: "false" },
      });
    });
    redisClient.on(
      "reconnecting",
      ({
        delay,
        attempt,
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
            delay,
          },
          tagOverrides: { samplingEnabled: "false" },
        });
      }
    );
    await redisClient.connect();
    return redisClient;
  };

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type Selector<T, S> = {
  readonly select: (type: T) => ReadonlyArray<S>;
  readonly selectOne: (type: T) => S;
};

export type RedisClientSelectorType = Selector<
  RedisClientMode,
  redis.RedisClusterType
>;

export enum RedisClientMode {
  "ALL" = "ALL",
  "SAFE" = "SAFE",
  "FAST" = "FAST",
}

export const RedisClientSelector =
  (enableTls: boolean, appInsightsClient?: appInsights.TelemetryClient) =>
  async (
    redisUrl: string,
    password?: string,
    port?: string
  ): Promise<RedisClientSelectorType> => {
    const FAST_REDIS_CLIENT = await createClusterRedisClient(
      enableTls,
      appInsightsClient
    )(redisUrl, password, port);
    const SAFE_REDIS_CLIENT = await createClusterRedisClient(
      enableTls,
      appInsightsClient,
      false
    )(redisUrl, password, port);
    const select = (t: RedisClientMode) => {
      switch (t) {
        case RedisClientMode.ALL: {
          return [SAFE_REDIS_CLIENT, FAST_REDIS_CLIENT];
        }
        case RedisClientMode.SAFE: {
          return [SAFE_REDIS_CLIENT];
        }
        case RedisClientMode.FAST: {
          return [FAST_REDIS_CLIENT];
        }
        default: {
          throw new Error("Unexpected selector for redis client");
        }
      }
    };
    return {
      select,
      selectOne: (t) => select(t)[0],
    };
  };
