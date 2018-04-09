import * as msRest from "ms-rest-js";

export default class SimpleResponse {
  constructor(
    private readonly httpOperationResponse: msRest.HttpOperationResponse
  ) {}

  // tslint:disable-next-line:no-any
  public bodyAsJson(): any {
    return this.httpOperationResponse.bodyAsJson;
  }

  public status(): number {
    return this.httpOperationResponse.response.status;
  }
}
