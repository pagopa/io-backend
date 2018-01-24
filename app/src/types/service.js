// @flow

"use strict";

import t from "flow-runtime";
import { ServicePublic } from "../api/models";

const ServiceModel = t.object(
  t.property("serviceId", t.string()),
  t.property("serviceName", t.string()),
  t.property("organizationName", t.string()),
  t.property("departmentName", t.string()),
  t.property("version", t.number(), true)
);

export type Service = t.TypeOf<typeof ServiceModel>;

/**
 * Converts an API ServicePublic to a Proxy service.
 *
 * @param from
 * @returns {Service}
 */
export function ServicePublicToAppService(from: ServicePublic): Service {
  return from;
}
