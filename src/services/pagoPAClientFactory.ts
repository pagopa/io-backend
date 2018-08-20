/**
 * This service builds API client by wrapping the PagoPAClientFactory client
 * built by the AutoRest tool.
 *
 * @see ../clients/pagopa/PagoPAClientFactory
 */

import { ServiceClientOptions } from "../../node_modules/ms-rest-js";
import { ProxyPagoPA } from "../clients/pagopa/proxyPagoPA";
import { IPagoPAClientFactoryInterface } from "./IPagoPAClientFactory";

export default class PagoPAClientFactory
  implements IPagoPAClientFactoryInterface {
  constructor(public readonly pagoPAApiUrl?: string) {}
  /**
   * {@inheritDoc}
   */
  public getClient(
    codiceContestoPagamento: string,
    rptIdFromString: string
  ): ProxyPagoPA {
    const serviceClientOptions: ServiceClientOptions = {
      noRetryPolicy: true // If set to true, turn off the default retry policy
    };
    return new ProxyPagoPA(
      codiceContestoPagamento,
      rptIdFromString,
      this.pagoPAApiUrl,
      serviceClientOptions
    );
  }
}
