/**
 * This file adds a wrapper to the GetServicesByRecipientOKResponse to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { readonlyArray, string } from "io-ts";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { ServiceTuple } from "../api/ServiceTuple";

// required attributes
const GetServicesByRecipientOKResponseR = t.interface({
  items: readonlyArray(ServiceTuple),
  pageSize: NonNegativeInteger
});

// optional attributes
const GetServicesByRecipientOKResponseO = t.partial({
  next: string
});

export const GetServicesByRecipientOKResponse = t.intersection([
  GetServicesByRecipientOKResponseR,
  GetServicesByRecipientOKResponseO
]);

export type GetServicesByRecipientOKResponse = t.TypeOf<
  typeof GetServicesByRecipientOKResponse
>;
