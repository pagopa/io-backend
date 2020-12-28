import { Express } from "express";

/*
 * Standard interface for Backend controllers
 */
export interface IBackendController {
  /**
   * Method used for seting up routing for Controller
   */
  setupRouting(app: Express, basePath: string, ...middlewares: any): void;
}
