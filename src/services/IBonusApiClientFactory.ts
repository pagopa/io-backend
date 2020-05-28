/**
 * Interface for the Bonus API client factories.
 */

import { BonusAPIClient } from "../clients/bonus";

export interface IBonusAPIClientFactoryInterface {
  /**
   * Retrieves a configured instance of the Bonus API client.
   */
  readonly getClient: () => ReturnType<BonusAPIClient>;
}
