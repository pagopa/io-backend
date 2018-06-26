import * as logform from "logform";
import { createLogger, format, transports } from "winston";

const { timestamp, printf } = logform.format;

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
