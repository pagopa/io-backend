import * as http from "http";
import * as https from "https";
import { Express } from "express";
import * as httpGracefulShutdown from "http-graceful-shutdown";
import { log } from "./logger";

export function initHttpGracefulShutdown(
  server: http.Server | https.Server,
  app: Express,
  options: httpGracefulShutdown.Options
): void {
  log.info("Initializing server graceful shutdown");
  httpGracefulShutdown(server, {
    ...options,
    finally: () => {
      if (options.finally) {
        options.finally();
      }
      app.emit("server:stop");
    }
  });
}
