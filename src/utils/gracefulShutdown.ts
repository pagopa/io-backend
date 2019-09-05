import { Express } from "express";
import * as http from "http";
import * as httpGracefulShutdown from "http-graceful-shutdown";
import * as https from "https";
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
