import type { APIError } from "../types/error";
import type { User } from "../types/user";
import { extractUserFromRequest } from "../types/user";
import {
  ServicePublicModel,
  validateProblemJson,
  validateResponse
} from "../types/api";
import ControllerBase from "./ControllerBase";
import type { ApiClientFactoryInterface } from "../services/apiClientFactoryInterface";
import { ServicePublicToAppService } from "../types/service";

/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */
export default class ServicesController extends ControllerBase {
  /**
   * Class constructor.
   *
   * @param apiClient
   */
  constructor(apiClient: ApiClientFactoryInterface) {
    super(apiClient);
  }

  /**
   * Returns the service identified by the provided id
   * code.
   *
   * @param req
   * @param res
   */
  getService(req: express$Request, res: express$Response) {
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
              validateResponse(maybeService, ServicePublicModel).fold(
                // Look if object is a ProblemJson.
                () => validateProblemJson(maybeService, res),
                // All correct, return the response to the client.
                service => {
                  res.json(ServicePublicToAppService(service));
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
}
