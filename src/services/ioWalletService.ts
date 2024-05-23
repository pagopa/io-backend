/* eslint-disable default-case */
/**
 * This service interacts with the IO Wallet API
 */

import {
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorGeneric,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { IoWalletAPIClient } from "src/clients/io-wallet";
import { UserDetailView } from "generated/io-wallet-api/UserDetailView";
import {
  withCatchAsInternalError,
  withValidatedOrInternalError,
} from "../utils/responses";

export default class IoWalletService {
  constructor(
    private readonly ioWalletApiClient: ReturnType<IoWalletAPIClient>
  ) {}

  /**
   * Get the Wallet User id.
   */
  public readonly getUserByFiscalCode = (
    fiscalCode: FiscalCode
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorGeneric
    | IResponseSuccessJson<UserDetailView>
  > =>
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
              "Your request didn't validate"
            );
          case 500:
            return ResponseErrorInternal(
              `Internal server error | ${response.value}`
            );
        }
      });
    });
}
