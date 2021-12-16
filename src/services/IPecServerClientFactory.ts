/**
 * Interface for the API client factories.
 */

import { IPecServerClient } from "../clients/pecserver";

export interface IPecServerClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   */
  readonly getClient: (bearer: string) => ReturnType<IPecServerClient>;
}
