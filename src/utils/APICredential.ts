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
   * Signs a request with the Authentication header.
   *
   * This method adds to the webResource parameter a specific header used to
   * authenticate the request to the API system.
   *
   * @param {WebResource} webResource The WebResource/request to be signed.
   * @returns {Promise<WebResource>} The signed request object;
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
