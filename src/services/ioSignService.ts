/**
 * This service interacts with the IO Sign API
 */

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  IResponseSuccessRedirectToResource,
  ProblemJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponseSuccessJson,
  ResponseSuccessRedirectToResource
} from "@pagopa/ts-commons/lib/responses";

import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";

import {
  EmailString,
  FiscalCode,
  NonEmptyString
} from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import { CreateSignatureBody as CreateSignatureBodyApiModel } from "generated/io-sign-api/CreateSignatureBody";

import { SignerDetailView } from "../../generated/io-sign-api/SignerDetailView";
import { FilledDocumentDetailView } from "../../generated/io-sign/FilledDocumentDetailView";
import { Id } from "../../generated/io-sign/Id";

import { QtspClausesMetadataDetailView } from "../../generated/io-sign/QtspClausesMetadataDetailView";

import { SignatureDetailView } from "../../generated/io-sign/SignatureDetailView";
import { SignatureRequestDetailView } from "../../generated/io-sign/SignatureRequestDetailView";
import { IoSignAPIClient } from "../clients/io-sign";
import {
  ResponseErrorStatusNotDefinedInSpec,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";
import { readableProblem } from "../utils/errorsFormatter";
import { IoSignLollipopLocalsType } from "../controllers/ioSignController";
import { ResponseErrorNotFound403 } from "./eucovidcertService";

const internalServerError = "Internal server error";
const invalidRequest = "Invalid request";
const resourcesNotFound = "Resources not found";
const userNotFound =
  "The user associated with this profile could not be found.";
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
              invalidRequest,
              `An error occurred while validating the request body | ${response.value}`
            );
          case 403:
            return ResponseErrorNotFound403(userNotFound);
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
    | IResponseSuccessRedirectToResource<
        FilledDocumentDetailView,
        FilledDocumentDetailView
      >
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
            return ResponseSuccessRedirectToResource(
              response.value,
              pipe(
                response.headers.Location,
                O.fromNullable,
                O.getOrElse(() => response.value.filled_document_url)
              ),
              response.value
            );
          case 400:
            return ResponseErrorValidation(
              invalidRequest,
              `An error occurred while validating the request body | ${response.value}`
            );
          case 404:
            return ResponseErrorNotFound(resourcesNotFound, userNotFound);
          case 500:
            return ResponseErrorInternal(
              // TODO [SFEQS-1199]: When the code for openapi-codegen-ts is fixed, refactor this section.
              // Now, it generates incorrect output whenever the http status is 500.
              pipe(
                response.value,
                ProblemJson.decode,
                E.map(readableProblem),
                E.getOrElse(() => internalServerError)
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
              // TODO [SFEQS-1199]: When the code for openapi-codegen-ts is fixed, refactor this section.
              // Now, it generates incorrect output whenever the http status is 500. [SFEQS-1199]
              pipe(
                response.value,
                ProblemJson.decode,
                E.map(readableProblem),
                E.getOrElse(() => internalServerError)
              )
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Create a Signature from a Signature Request
   */
  public readonly createSignature = (
    ioSignLollipopLocals: IoSignLollipopLocalsType,
    body: CreateSignatureBodyApiModel,
    signerId: Id
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<SignatureDetailView>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioSignApiClient.createSignature({
        ...ioSignLollipopLocals,
        body,
        "x-iosign-signer-id": signerId
      });
      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 400:
            return ResponseErrorValidation(
              invalidRequest,
              `An error occurred while validating the request body | ${response.value}`
            );
          case 404:
            return ResponseErrorNotFound(
              resourcesNotFound,
              "Signature request not found"
            );
          case 403:
            return ResponseErrorNotFound403(userNotFound);
          case 500:
            return ResponseErrorInternal(
              pipe(
                response.value,
                ProblemJson.decode,
                E.map(readableProblem),
                E.getOrElse(() => internalServerError)
              )
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Get a Signature Request from id
   */
  public readonly getSignatureRequest = (
    signatureRequestId: Id,
    signerId: Id
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<SignatureRequestDetailView>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioSignApiClient.getSignatureRequestById({
        id: signatureRequestId,
        "x-iosign-signer-id": signerId
      });
      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 404:
            return ResponseErrorNotFound(
              resourcesNotFound,
              "Signature request not found"
            );
          case 403:
            return ResponseErrorNotFound403(userNotFound);
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
