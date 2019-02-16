import * as express from "express";
import { TypeofApiResponse } from "io-ts-commons/lib/requests";

import PagoPAProxyService from "../services/pagoPAProxyService";

import {
  ActivatePaymentT,
  GetActivationStatusT,
  GetPaymentInfoT
} from "../types/api/requestTypes";

import { AsControllerResponseType } from "../utils/types";

/**
 * This controller handles requests made by the APP that needs to be forwarded to the PagoPA proxy.
 */

export default class PagoPAProxyController {
  constructor(private readonly pagoPAProxyService: PagoPAProxyService) {}

  public async getPaymentInfo(
    req: express.Request
  ): Promise<AsControllerResponseType<TypeofApiResponse<GetPaymentInfoT>>> {
    // FIXME: implicit any
    const rptId = req.params.rptId;
    return await this.pagoPAProxyService.getPaymentInfo({
      rptId
    });
  }

  public async activatePayment(
    req: express.Request
  ): Promise<AsControllerResponseType<TypeofApiResponse<ActivatePaymentT>>> {
    // FIXME: implicit any
    const paymentActivationsPostRequest = req.body;
    return await this.pagoPAProxyService.activatePayment({
      paymentActivationsPostRequest
    });
  }

  public async getActivationStatus(
    req: express.Request
  ): Promise<
    AsControllerResponseType<TypeofApiResponse<GetActivationStatusT>>
  > {
    // FIXME: implicit any
    const codiceContestoPagamento = req.params.codiceContestoPagamento;
    return await this.pagoPAProxyService.getActivationStatus({
      codiceContestoPagamento
    });
  }
}
