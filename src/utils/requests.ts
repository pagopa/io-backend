import { IncomingHttpHeaders } from "http";

/**
 * Supported cache-control properties
 */
export interface ICacheControl {
  "no-cache"?: true;
  "no-store"?: true;
  public?: true;
  private?: true;
  "max-age"?: number;
  "s-maxage"?: number;
  immutable?: true;
}

/**
 * An implementation for a Cache-Control Header parser.
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
 * @param headers IncomingHttpHeaders
 * @returns ICacheControl
 */
export function parseCacheControlHeader(
  headers: IncomingHttpHeaders
): ICacheControl {
  const originalCacheControl = headers["cache-control"];
  if (originalCacheControl) {
    return originalCacheControl
      .replace(" ", "") // Remove all spaces from cache-control string value
      .split(",")
      .reduce((acc: ICacheControl, cc) => {
        const value = cc.split("=");
        if (value.length === 1) {
          // Properties without a number value
          switch (value[0]) {
            case "no-cache":
            case "no-store":
            case "public":
            case "private":
            case "immutable":
              return { ...acc, [value[0]]: true };
          }
        } else {
          // Properties with a number value
          switch (value[0]) {
            case "max-age":
            case "s-maxage":
              return { ...acc, [value[0]]: Number(value[1]) };
          }
        }
        return acc;
      }, {});
  } else {
    return {};
  }
}
