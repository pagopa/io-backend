/**
 * Interface for the PagoPA client factories.
 */

export interface IPagoPAClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   */
  getClient(): PagoPAClient;
}
