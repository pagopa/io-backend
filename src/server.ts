/**
 * Main entry point for the Digital Citizenship proxy.
 */

import * as http from "http";
import { CIDR } from "italia-ts-commons/lib/strings";
import * as winston from "winston";
import { newApp } from "./app";
import container from "./container";

const port = container.resolve<number>("serverPort");
const env = container.resolve<string>("env");
const allowNotifyIPSourceRange = container.resolve<CIDR>(
  "allowNotifyIPSourceRange"
);

const app = newApp(env, allowNotifyIPSourceRange);

const server = http.createServer(app).listen(port, () => {
  winston.info("Listening on port %d", server.address().port);
});
