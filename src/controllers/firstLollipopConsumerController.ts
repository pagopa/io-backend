import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  ResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import { LollipopLocals } from "../types/lollipop";

export const firstLollipopSign = (
  _req: express.Request,
  _locals?: LollipopLocals
): Promise<IResponseErrorValidation | IResponseErrorInternal> =>
  Promise.resolve(ResponseErrorInternal("Non yet implemented"));
