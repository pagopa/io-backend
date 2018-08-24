/**
 * Common logging utilities (winston configuration).
 */
import * as logform from "logform";
import { createLogger, format, transports } from "winston";
const { timestamp, printf } = logform.format;
import { DateFromISOStringType } from "io-ts-types/lib/Date/DateFromISOString";

export const enum IWinstonTransportLevel {
  "info" = "info",
  "error" = "error",
  "warn" = "warn",
  "debug" = "debug"
}

export interface IWinstonTransportInfo {
  readonly message: string;
  readonly level: IWinstonTransportLevel;
  readonly timestamp: DateFromISOStringType;
}

export const log = createLogger({
  format: format.combine(
    timestamp(),
    format.splat(),
    format.simple(),
    printf(nfo => {
      return `${nfo.timestamp} [${nfo.level}]: ${nfo.message}`;
    })
  ),
  transports: [new transports.Console()]
});
