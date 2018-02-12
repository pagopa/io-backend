// @flow

"use strict";

type DetailedError = {
  +statusCode: number
};

export type APIError = DetailedError & Error;
