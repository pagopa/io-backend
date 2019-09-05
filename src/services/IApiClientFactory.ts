/**
 * Interface for the API client factories.
 */

import { APIClient } from "../clients/api";

export interface IApiClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   */
  readonly getClient: () => ReturnType<APIClient>;
}
