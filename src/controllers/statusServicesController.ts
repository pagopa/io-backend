import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { Request } from "express";

import { ServicesStatus } from "../../generated/public/ServicesStatus";
import { StatusEnumEnum } from "../../generated/public/StatusEnum";
import { withValidatedOrInternalError } from "../utils/responses";

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
    ServicesStatus.decode({
      services: [
        {
          id: "io-backend",
          status: StatusEnumEnum.OK,
          details: "IO Backend service is running"
        }
      ]
    }),
    (servicesStatus) => ResponseSuccessJson(servicesStatus)
  );
