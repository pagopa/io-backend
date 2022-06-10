/**
 * This service builds API clients.
 */

import nodeFetch from "node-fetch";

import { PagoPAClient } from "../clients/pagopa";
import {
  IPagoPAClientFactoryInterface,
  PagoPAEnvironment
} from "./IPagoPAClientFactory";

// TODO: this class is actually useless as PagoPAClient is immutable, it can be removed
export default class PagoPAClientFactory
  implements IPagoPAClientFactoryInterface {
  private readonly prodApiClient!: ReturnType<PagoPAClient>;
  private readonly testApiClient!: ReturnType<PagoPAClient>;

  constructor(
    pagoPAApiUrlProd: string,
    pagoPAApiKeyProd: string,
    pagoPAApiUrlUAT: string,
    pagoPAApiKeyUAT: string,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
  ) {
    this.prodApiClient = PagoPAClient(
      pagoPAApiUrlProd,
      pagoPAApiKeyProd,
      fetchApi
    );
    this.testApiClient = PagoPAClient(
      pagoPAApiUrlUAT,
      pagoPAApiKeyUAT,
      fetchApi
    );
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
