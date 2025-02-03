import { IResponseErrorValidation } from "@pagopa/ts-commons/lib/responses";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";

import { withValidatedOrValidationError } from "../utils/responses";

export const withFiscalCodeFromRequestParams = async <T>(
  req: express.Request,
  f: (fiscalCode: FiscalCode) => Promise<T>
): Promise<IResponseErrorValidation | T> =>
  withValidatedOrValidationError(FiscalCode.decode(req.params.fiscal_code), f);
