import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { Request } from "express";

import { ServicesStatus } from "../../generated/public/ServicesStatus";
import { withValidatedOrInternalError } from "../utils/responses";
import { mockServicesStatus } from "./__mocks__/statusServices";

/**
 * Returns the current status of all microservices.
 *
 * @param req - Express request object
 */
export const getStatusServices = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _req: Request
): Promise<IResponseErrorInternal | IResponseSuccessJson<ServicesStatus>> =>
  withValidatedOrInternalError(
    ServicesStatus.decode(mockServicesStatus),
    (servicesStatus) => ResponseSuccessJson(servicesStatus)
  );
