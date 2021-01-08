/**
 * Interface for the PagoPA client factories.
 */
import { PagoPAClient } from "../clients/pagopa";

// eslint-disable-next-line no-shadow
export enum PagoPAEnvironment {
  PRODUCTION = "PRODUCTION",
  TEST = "TEST"
}

export interface IPagoPAClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   */
  readonly getClient: (
    environment: PagoPAEnvironment
  ) => ReturnType<PagoPAClient>;
}
