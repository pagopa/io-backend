// @flow

"use strict";

import type { APIError } from "../types/error";
import { toAppMessage } from "../types/message";
import type { User } from "../types/user";
import { extractUserFromRequest } from "../types/user";
import {
  validateGetMessagesByUserOKResponseModel,
  validateMessageResponseModel,
  validateProblemJson
} from "../types/api";
import ControllerBase from "./ControllerBase";
import type { ApiClientFactoryInterface } from "../services/apiClientFactoryInterface";
import type { AdminApiClientFactoryInterface } from "../services/adminApiClientFactoryInterface";

/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */
export default class MessagesController extends ControllerBase {
  adminApiClient: AdminApiClientFactoryInterface;

  constructor(
    apiClient: ApiClientFactoryInterface,
    adminApiClient: AdminApiClientFactoryInterface
  ) {
    super(apiClient);

    this.adminApiClient = adminApiClient;
  }

  /**
   * Returns the messages for the user identified by the provided fiscal
   * code.
   *
   * @param req
   * @param res
   */
  getUserMessages(req: express$Request, res: express$Response) {
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
          .getMessagesByUser()
          .then(
            maybeApiMessages => {
              // Look if the response is a GetMessagesByUserOKResponse.
              validateGetMessagesByUserOKResponseModel(maybeApiMessages).fold(
                // Look if object is a ProblemJson.
                () => validateProblemJson(maybeApiMessages, res),
                // All correct, return the response to the client.
                apiMessages => {
                  const appMessages = apiMessages.items.map(toAppMessage);
                  res.json({
                    items: appMessages,
                    pageSize: apiMessages.pageSize
                  });
                }
              );
            },
            function(err: APIError) {
              res.status(err.statusCode).json({
                message: err.message
              });
            }
          );
      }
    );
  }

  /**
   * Returns the message identified by the message id.
   *
   * @param req
   * @param res
   */
  getUserMessage(req: express$Request, res: express$Response) {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      (error: String) => {
        res.status(500).json({
          message: error
        });
      },
      (user: User) => {
        this.apiClient
          .getClient(user.fiscal_code)
          .getMessage(req.params.id)
          .then(
            maybeApiMessage => {
              // Look if the response is a GetProfileOKResponse.
              validateMessageResponseModel(maybeApiMessage).fold(
                // Look if object is a ProblemJson.
                () => validateProblemJson(maybeApiMessage, res),
                // All correct, return the response to the client.
                apiMessage => {
                  res.json(toAppMessage(apiMessage));
                }
              );
            },
            function(err: APIError) {
              res.status(err.statusCode).json({
                message: err.message
              });
            }
          );
      }
    );
  }

  // getService(serviceId: string, res: express$Response): Service {
  //   this.adminApiClient
  //     .getClient()
  //     .getService(serviceId)
  //     .then(
  //       // (maybeService: Service | ProblemJson) => {
  //       //   // Look if the response is a Service.
  //       //   t.validate(maybeService, Service).fold(
  //       //     // Look if object is a ProblemJson.
  //       //     () => this.validateProblemJson(maybeService, res),
  //       //     service => {
  //       //       return service;
  //       //     }
  //       //   );
  //       // },
  //       maybeService => {
  //         this.x < Service > (maybeService, res);
  //       },
  //       function(err: APIError) {
  //         res.status(err.statusCode).json({
  //           message: err.message
  //         });
  //       }
  //     );
  // }
  //
  // x<A>(object: A, res: express$Response): A {
  //   const UserType = (reify: Type<User>);
  //
  //   // Look if the response is a Service.
  //   t.validate(object, A).fold(
  //     // Look if object is a ProblemJson.
  //     () => this.validateProblemJson(object, res),
  //     y => {
  //       return y;
  //     }
  //   );
  //
  //   return object;
  // }
}
