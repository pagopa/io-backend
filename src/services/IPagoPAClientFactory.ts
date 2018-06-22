/**
 * Interface for the PagoPA client factories.
 */

import { ProxyPagoPA } from "../clients/pagopa/proxyPagoPA";

export interface IPagoPAClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   */
  getClient(
    codiceContestoPagamento: string,
    rptIdFromString: string
  ): ProxyPagoPA;
}
