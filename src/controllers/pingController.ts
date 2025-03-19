import {
  IResponseSuccessNoContent,
  ResponseSuccessNoContent
} from "@pagopa/ts-commons/lib/responses";
import { Request } from "express";

/**
 * Returns success no content.
 *
 * @param req - Express request object
 */
export const getPing = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _req: Request
): Promise<IResponseSuccessNoContent> => ResponseSuccessNoContent();
