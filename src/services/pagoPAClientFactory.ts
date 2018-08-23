/**
 * This service builds API clients.
 */

import { IPagoPAClientFactoryInterface } from "./IPagoPAClientFactory";

export default class PagoPAClientFactory
  implements IPagoPAClientFactoryInterface {
  constructor(public readonly pagoPAApiUrl?: string) {}
  /**
   * {@inheritDoc}
   */
  public getClient(): PagoPAClient {
    return new PagoPAClient(this.pagoPAApiUrl);
  }
}
