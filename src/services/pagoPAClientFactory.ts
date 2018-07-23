/**
 * This service builds API client by wrapping the PagoPAClientFactory client
 * built by the AutoRest tool.
 *
 * @see ../clients/pagopa/PagoPAClientFactory
 */

import { ProxyPagoPA } from "../clients/pagopa/proxyPagoPA";
import { IPagoPAClientFactoryInterface } from "./IPagoPAClientFactory";

export default class PagoPAClientFactory
  implements IPagoPAClientFactoryInterface {
  /**
   * {@inheritDoc}
   */
  public getClient(
    codiceContestoPagamento: string,
    rptIdFromString: string
  ): ProxyPagoPA {
    return new ProxyPagoPA(codiceContestoPagamento, rptIdFromString);
  }
}
