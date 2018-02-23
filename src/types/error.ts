/**
 *
 */

interface IDetailedError {
  readonly statusCode: number;
}

export type APIError = IDetailedError & Error;
