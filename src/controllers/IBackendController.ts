import { Router } from "express";

/*
 * Standard interface for Controllers
 */
export interface IBackendController {
  /**
   * Method used for setting up routing for Controller
   * @param router An Express app router
   * @returns router
   */
  readonly setupRouting: (app: Router) => void;
}
