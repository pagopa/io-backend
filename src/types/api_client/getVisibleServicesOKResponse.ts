/**
 * This file adds a wrapper to the GetVisibleServicesOKResponse to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { readonlyArray, string } from "io-ts";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { ServiceTuple } from "../api/ServiceTuple";

// required attributes
const GetVisibleServicesOKResponseR = t.interface({
  items: readonlyArray(ServiceTuple),
  pageSize: NonNegativeInteger
});

// optional attributes
const GetVisibleServicesOKResponseO = t.partial({
  next: string
});

export const GetVisibleServicesOKResponse = t.intersection([
  GetVisibleServicesOKResponseR,
  GetVisibleServicesOKResponseO
]);

export type GetVisibleServicesOKResponse = t.TypeOf<
  typeof GetVisibleServicesOKResponse
>;
