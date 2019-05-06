/**
 * This service builds API clients.
 */

import {
  IPagoPAClientFactoryInterface,
  PagoPAEnvironment
} from "./IPagoPAClientFactory";

import { PagoPAClient } from "../clients/pagopa";

export default class PagoPAClientFactory
  implements IPagoPAClientFactoryInterface {
  constructor(
    public readonly pagoPAApiUrl: string,
    public readonly pagoPAApiUrlTest: string
  ) {}

  /**
   * {@inheritDoc}
   */
  public getClient(environment: PagoPAEnvironment): ReturnType<PagoPAClient> {
    return PagoPAClient(
      environment === PagoPAEnvironment.TEST
        ? this.pagoPAApiUrlTest
        : this.pagoPAApiUrl
    );
  }
}
