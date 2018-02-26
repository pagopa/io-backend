/**
 *
 */

import * as express from "express";
import * as winston from "winston";
import { IApiClientFactoryInterface } from "../services/iApiClientFactory";
import { ServicePublic } from "../types/api_client/servicePublic";
import { APIError } from "../types/error";
import { toAppService } from "../types/service";
import { extractUserFromRequest, User } from "../types/user";
import { validateProblemJson, validateResponse } from "../utils/validators";

/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */
export default class ServicesController {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Returns the service identified by the provided id
   * code.
   *
   * @param req
   * @param res
   */
  public getService(req: express.Request, res: express.Response): void {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      () => {
        res.status(500).json({
          message:
            "There was an error extracting the user profile from the request."
        });
      },
      (user: User) => {
        this.apiClient
          .getClient(user.fiscal_code)
          .getService(req.params.id)
          .then(
            maybeService => {
              // Look if the response is a ServicePublic.
              validateResponse(maybeService, ServicePublic).fold(
                // Look if object is a ProblemJson.
                () => validateProblemJson(maybeService, res),
                // All correct, return the response to the client.
                service => {
                  res.json(toAppService(service));
                }
              );
            },
            (err: APIError) => {
              res.status(500).json({
                // Here usually we have connection or transmission errors.
                message: "The API call returns an error"
              });
              winston.log(
                "info",
                "error occurred in API call: %s",
                err.message
              );
            }
          );
      }
    );
  }
}
