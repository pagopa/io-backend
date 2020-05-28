/**
 * This service builds Bonus API clients.
 */

import nodeFetch from "node-fetch";

import { BonusAPIClient } from "../clients/bonus";
import { IBonusAPIClientFactoryInterface } from "./IBonusApiClientFactory";

// TODO: this class is actually useless as BonusAPIClient is immutable, it can be removed
export default class ApiClientFactory
  implements IBonusAPIClientFactoryInterface {
  private bonusApiClient!: ReturnType<BonusAPIClient>;

  constructor(
    apiKey: string,
    apiUrl: string,
    // tslint:disable-next-line: no-any
    fetchApi: typeof fetch = nodeFetch as any
  ) {
    this.bonusApiClient = BonusAPIClient(apiUrl, apiKey, fetchApi);
  }

  /**
   * {@inheritDoc}
   */
  public getClient(): ReturnType<BonusAPIClient> {
    return this.bonusApiClient;
  }
}
