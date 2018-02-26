/**
 *
 */

import * as t from "io-ts";
import { number, string } from "io-ts";
import { ServicePublic } from "../api/models";
import { NonNegativeNumber } from "../utils/numbers";

// required attributes
export const Service = t.interface({
  departmentName: string,
  organizationName: string,
  serviceId: string,
  serviceName: string,
  version: number
});

export type Service = t.TypeOf<typeof Service>;

/**
 * Converts an API ServicePublic to a Proxy service.
 *
 * ServicePublic is generated by the autorest tool and is returned by and API
 * call. Here we map all properties of ServicePublic to the proxy's Service
 * model that will ensure type validation in the rest of the proxy code.
 *
 * @param from
 * @returns {Service}
 */
export function toAppService(from: ServicePublic): Service {
  return {
    departmentName: from.departmentName,
    organizationName: from.organizationName,
    serviceId: from.serviceId,
    serviceName: from.serviceName,
    version: from.version as NonNegativeNumber
  };
}
