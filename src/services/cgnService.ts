/**
 * This service interactsnwith the Bonus API
 */

import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  IResponseSuccessRedirectToResource,
  ResponseErrorConflict,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessAccepted,
  ResponseSuccessJson,
  ResponseSuccessRedirectToResource
} from "italia-ts-commons/lib/responses";

import { fromNullable } from "fp-ts/lib/Option";
import { InstanceId } from "../../generated/io-cgn-api/InstanceId";
import { CgnActivationDetail } from "../../generated/io-cgn-api/CgnActivationDetail";
import { CgnAPIClient } from "../../src/clients/cgn";
import { Card } from "../../generated/io-cgn-api/Card";
import { User } from "../types/user";
import {
  ResponseErrorStatusNotDefinedInSpec,
  ResponseErrorUnexpectedAuthProblem,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";
import { readableProblem } from "../../src/utils/errorsFormatter";
export default class CgnService {
  constructor(private readonly cgnApiClient: ReturnType<CgnAPIClient>) {}

  /**
   * Get the current CGN Status related to the user.
   */
  public readonly getCgnStatus = (
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<Card>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnApiClient.getCgnStatus({
        fiscalcode: user.fiscal_code
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 404:
            return ResponseErrorNotFound("Not Found", "CGN not found");
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Start a CGN activation for the logged user.
   */
  public readonly startCgnActivation = (
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorConflict
    | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
    | IResponseSuccessAccepted
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnApiClient.startCgnActivation({
        fiscalcode: user.fiscal_code
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 201:
            return ResponseSuccessRedirectToResource(
              response.value,
              fromNullable(response.headers.Location).getOrElse(
                "/api/v1/cgn/activation"
              ),
              response.value
            );
          case 202:
            return ResponseSuccessAccepted();
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 403:
            return ResponseErrorForbiddenNotAuthorized;
          case 409:
            return ResponseErrorConflict(
              "Cannot start a new CGN activation because the CGN is already active, revoked or expired"
            );
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Get the current CGN Activation status related to the user.
   */
  public readonly getCgnActivation = (
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<CgnActivationDetail>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnApiClient.getCgnActivation({
        fiscalcode: user.fiscal_code
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 404:
            return ResponseErrorNotFound(
              "Not Found",
              "No User CGN activation found"
            );
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Start a CGN activation for the logged user.
   */
  public readonly startEycaActivation = (
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorConflict
    | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
    | IResponseSuccessAccepted
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnApiClient.startEycaActivation({
        fiscalcode: user.fiscal_code
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 201:
            return ResponseSuccessRedirectToResource(
              response.value,
              fromNullable(response.headers.Location).getOrElse(
                "/api/v1/cgn/eyca/activation"
              ),
              response.value
            );
          case 202:
            return ResponseSuccessAccepted();
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 403:
            return ResponseErrorForbiddenNotAuthorized;
          case 409:
            return ResponseErrorConflict(
              "Cannot start a new EYCA activation because EYCA card is already active, revoked or expired"
            );
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
