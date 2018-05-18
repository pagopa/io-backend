/**
 * Wraps the msRest.HttpOperationResponse class to provide simpler methods to access response data.
 */
import { HttpOperationResponse } from "ms-rest";

export default class SimpleResponse {
  constructor(
    // tslint:disable-next-line:no-any
    private readonly httpOperationResponse: HttpOperationResponse<any>
  ) {}

  // tslint:disable-next-line:no-any
  public parsedBody(): any {
    return this.httpOperationResponse.body;
  }

  public isOk(): boolean {
    return this.httpOperationResponse.response.statusCode === 200;
  }

  public isNotFound(): boolean {
    return this.httpOperationResponse.response.statusCode === 404;
  }
}
