/**
 * Interface for the PagoPA client factories.
 */
import { PagoPAClient } from "../clients/pagopa";

export interface IPagoPAClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   */
  readonly getClient: (
    environment: PagoPAEnvironment
  ) => ReturnType<PagoPAClient>;
}

export enum PagoPAEnvironment {
  PRODUCTION = "PRODUCTION",
  TEST = "TEST"
}
