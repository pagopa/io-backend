/**
 * Interface for the API client factories.
 */

import { APIClient } from "../api/api";

export interface IApiClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   */
  getClient(): APIClient;
}
