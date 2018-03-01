/**
 * This file extend the base Error with a statusCode field.
 */

interface IDetailedError {
  readonly statusCode: number;
}

export type APIError = IDetailedError & Error;
