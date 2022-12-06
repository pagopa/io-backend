/**
 * This service interacts with the IO Sign API
 */

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ProblemJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import { IoSignAPIClient } from "src/clients/io-sign";
import { SignerDetailView } from "generated/io-sign-api/SignerDetailView";
import { FilledDocumentDetailView } from "generated/io-sign-api/FilledDocumentDetailView";
import {
  EmailString,
  FiscalCode,
  NonEmptyString
} from "@pagopa/ts-commons/lib/strings";
import { Id } from "generated/io-sign-api/Id";

import {
  ResponseErrorStatusNotDefinedInSpec,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";
import { readableProblem } from "../../src/utils/errorsFormatter";
import { ResponseErrorNotFound403 } from "./eucovidcertService";

export default class IoSignService {
  constructor(private readonly ioSignApiClient: ReturnType<IoSignAPIClient>) {}

  /**
   * Get the Signer id related to the user.
   */
  public readonly getSignerByFiscalCode = (
    fiscalCode: FiscalCode
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<SignerDetailView>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioSignApiClient.getSignerByFiscalCode({
        body: { fiscal_code: fiscalCode }
      });
      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 400:
            return ResponseErrorValidation(
              "Invalid request",
              `An error occurred while validating the request body | ${response.value}`
            );
          case 403:
            return ResponseErrorNotFound403(
              "The user associated with this profile could not be found."
            );
          case 500:
            return ResponseErrorInternal(
              `Internal server error | ${response.value}`
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  public readonly createFilledDocument = (
    document_url: NonEmptyString,
    email: EmailString,
    family_name: NonEmptyString,
    name: NonEmptyString,
    signerId: Id
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<FilledDocumentDetailView>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioSignApiClient.createFilledDocument({
        body: {
          document_url,
          email,
          family_name,
          name
        },
        "x-iosign-signer-id": signerId
      });
      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 201:
            return ResponseSuccessJson(response.value);
          case 400:
            return ResponseErrorValidation(
              "Invalid request",
              `An error occurred while validating the request body | ${response.value}`
            );
          case 404:
            return ResponseErrorNotFound(
              "Resources not found",
              "The user associated with this profile could not be found."
            );
          case 500:
            return ResponseErrorInternal(
              readableProblem((response.value as unknown) as ProblemJson)
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
