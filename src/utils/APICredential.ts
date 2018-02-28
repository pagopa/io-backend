/**
 * This class provides ad implementation of ServiceClientCredentials that adds
 * a security header to the API calls.
 */

import { ServiceClientCredentials } from "ms-rest-js/lib/credentials/serviceClientCredentials";
import { WebResource } from "ms-rest-js/lib/webResource";

export class APICredentials implements ServiceClientCredentials {
  private readonly apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * {@inheritDoc}
   */
  public signRequest(webResource: WebResource): Promise<WebResource> {
    return new Promise(resolve => {
      if (!webResource.headers) {
        webResource.headers = {};
      }
      webResource.headers["Ocp-Apim-Subscription-Key"] = this.apiKey;
      return resolve(webResource);
    });
  }
}
