type DetailedError = {
  +statusCode: number
};

export type APIError = DetailedError & Error;
