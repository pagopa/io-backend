/**
 * Wraps the msRest.HttpOperationResponse class to provide simpler methods to access response data.
 */

import * as msRest from "ms-rest-js";

export default class SimpleResponse {
  constructor(
    private readonly httpOperationResponse: msRest.HttpOperationResponse
  ) {}

  // tslint:disable-next-line:no-any
  public parsedBody(): any {
    return this.httpOperationResponse.parsedBody;
  }

  public isOk(): boolean {
    return this.httpOperationResponse.response.status === 200;
  }

  public isNotFound(): boolean {
    return this.httpOperationResponse.response.status === 404;
  }
}
