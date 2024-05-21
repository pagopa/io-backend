/**
 * This service interacts with the IO Wallet API
 */

import {
  ResponseErrorGeneric,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import {
  withCatchAsInternalError,
  withValidatedOrInternalError,
} from "../utils/responses";
import { IoWalletAPIClient } from "src/clients/io-wallet";

export default class IoWalletService {
  constructor(
    private readonly ioWalletApiClient: ReturnType<IoWalletAPIClient>
  ) {}

  /**
   * Get the User id.
   */
  public readonly getUserByFiscalCode = (fiscalCode: FiscalCode) =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioWalletApiClient.getUserByFiscalCode({
        body: { fiscal_code: fiscalCode },
      });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 422:
            return ResponseErrorGeneric(
              response.status,
              "Unprocessable Content",
              ""
            );
          case 500:
            return ResponseErrorInternal(
              `Internal server error | ${response.value}`
            );
          default:
            return ResponseErrorInternal(`Internal server error`);
        }
      });
    });
}
