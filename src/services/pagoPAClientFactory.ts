/**
 * This service builds API clients.
 */

import nodeFetch from "node-fetch";

import {
  IPagoPAClientFactoryInterface,
  PagoPAEnvironment
} from "./IPagoPAClientFactory";

import { PagoPAClient } from "../clients/pagopa";

// TODO: this class is actually useless as PagoPAClient is immutable, it can be removed
export default class PagoPAClientFactory
  implements IPagoPAClientFactoryInterface {
  private prodApiClient!: ReturnType<PagoPAClient>;
  private testApiClient!: ReturnType<PagoPAClient>;

  constructor(
    pagoPAApiUrlProd: string,
    pagoPAApiUrlTest: string,
    // tslint:disable-next-line:no-any
    fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
  ) {
    this.prodApiClient = PagoPAClient(pagoPAApiUrlProd, fetchApi);
    this.testApiClient = PagoPAClient(pagoPAApiUrlTest, fetchApi);
  }

  /**
   * {@inheritDoc}
   */
  public getClient(environment: PagoPAEnvironment): ReturnType<PagoPAClient> {
    return environment === PagoPAEnvironment.TEST
      ? this.testApiClient
      : this.prodApiClient;
  }
}
