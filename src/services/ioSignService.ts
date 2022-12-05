/**
 * This service interacts with the IO Sign API
 */

import {
  IResponseErrorForbiddenNotAuthorized,
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
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Id } from "generated/io-sign-api/Id";
import { QtspClausesMetadataDetailView } from "generated/io-sign-api/QtspClausesMetadataDetailView";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import { User } from "../types/user";
import {
  ResponseErrorStatusNotDefinedInSpec,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";
import { readableProblem } from "../../src/utils/errorsFormatter";
import { ResponseErrorNotFound403 } from "./eucovidcertService";
const resourcesNotFound = "Resources not found";
export default class IoSignService {
  constructor(private readonly ioSignApiClient: ReturnType<IoSignAPIClient>) {}

  /**
   * Get the Signer id related to the user.
   */
  public readonly getSignerByFiscalCode = (
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<SignerDetailView>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioSignApiClient.getSignerByFiscalCode({
        body: { fiscal_code: user.fiscal_code }
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
    | IResponseErrorForbiddenNotAuthorized
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
              resourcesNotFound,
              "The user associated with this profile could not be found."
            );
          case 500:
            return ResponseErrorInternal(
              // TODO [SFEQS-1199]: When the code for openapi-codegen-ts is fixed, refactor this section. 
              // Now, it generates incorrect output whenever the http status is 500. 
              pipe(
                response.value,
                ProblemJson.decode,
                E.map(readableProblem),
                E.getOrElse(() => "Internal server error!")
              )
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Get the QTSP clauses
   */
  public readonly getQtspClausesMetadata = (): Promise<
    IResponseErrorInternal | IResponseSuccessJson<QtspClausesMetadataDetailView>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioSignApiClient.getQtspClausesMetadata({});
      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 500:
            return ResponseErrorInternal(
              // TODO: The response generated in case of Error is undefined and not a ProblemJson. [SFEQS-1199]
              pipe(
                response.value,
                ProblemJson.decode,
                E.map(readableProblem),
                E.getOrElse(() => "Internal server error!")
              )
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
