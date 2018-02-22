/**
 *
 */

import * as express from "express";
import { IApiClientFactoryInterface } from "../services/iApiClientFactory";
import {
  validateProblemJson,
  validateResponse
} from "../types/api";
import { ServicePublic } from "../types/api/ServicePublic";
import { APIError } from "../types/error";
import { ServicePublicToAppService } from "../types/service";
import { extractUserFromRequest, User } from "../types/user";
import ControllerBase from "./ControllerBase";

/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */
export default class ServicesController extends ControllerBase {

  constructor(apiClient: IApiClientFactoryInterface) {
    super(apiClient);
  }

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
              // Look if the response is a GetMessagesByUserOKResponse.
              validateResponse(maybeService, ServicePublic).fold(
                // Look if object is a ProblemJson.
                () => validateProblemJson(maybeService, res),
                // All correct, return the response to the client.
                service => {
                  res.json(ServicePublicToAppService(service));
                }
              );
            },
            (err:APIError) => {
              res.status(err.statusCode).json({
                message: err.message
              });
            }
          );
      }
    );
  }
}
