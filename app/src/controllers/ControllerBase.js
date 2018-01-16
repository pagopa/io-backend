// @flow

"use strict";

import * as t from "io-ts/lib/index";
import { ProblemJsonModel } from "../types/api";
import type { ApiClientFactoryInterface } from "../services/apiClientFactoryInterface";

/**
 * Base class for all the controllers that need the apiClient service.
 */
export default class ControllerBase {
  apiClient: ApiClientFactoryInterface;

  /**
   * Class constructor.
   *
   * @param apiClient
   */
  constructor(apiClient: ApiClientFactoryInterface) {
    this.apiClient = apiClient;
  }

  /**
   * Validates on object against the ProblemJsonModel data type.
   *
   * @param object
   * @param res
   */
  validateProblemJson(object: any, res: express$Response) {
    t.validate(object, ProblemJsonModel).fold(
      () => {
        res.status(500).json({
          // If we reach this point something very bad has happened.
          message: "Unrecoverable error."
        });
      },
      error => {
        res.status(error.status).json({
          // Forward the error received from the API.
          message: error.detail
        });
      }
    );
  }
}
