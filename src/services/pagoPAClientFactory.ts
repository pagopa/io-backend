/**
 * This service builds API clients.
 */

import { IPagoPAClientFactoryInterface } from "./IPagoPAClientFactory";

import { PagoPAClient } from "../clients/pagopa";

export default class PagoPAClientFactory
  implements IPagoPAClientFactoryInterface {
  constructor(public readonly pagoPAApiUrl?: string) {}
  /**
   * {@inheritDoc}
   */
  public getClient(): PagoPAClient {
    return PagoPAClient(this.pagoPAApiUrl);
  }
}
