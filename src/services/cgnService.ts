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
} from "@pagopa/ts-commons/lib/responses";

import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";
import { EycaActivationDetail } from "@pagopa/io-functions-cgn-sdk/EycaActivationDetail";
import { EycaCard } from "@pagopa/io-functions-cgn-sdk/EycaCard";
import { InstanceId } from "@pagopa/io-functions-cgn-sdk/InstanceId";
import { CgnActivationDetail } from "@pagopa/io-functions-cgn-sdk/CgnActivationDetail";
import { Card } from "@pagopa/io-functions-cgn-sdk/Card";
import { Otp } from "@pagopa/io-functions-cgn-sdk/Otp";
import { CgnAPIClient } from "../../src/clients/cgn";
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
   * Get the current Eyca Card Status related to the user.
   */
  public readonly getEycaStatus = (
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorConflict
    | IResponseSuccessJson<EycaCard>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnApiClient.getEycaStatus({
        fiscalcode: user.fiscal_code
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 403:
            return ResponseErrorForbiddenNotAuthorized;
          case 404:
            return ResponseErrorNotFound("Not Found", "Eyca Card not found");
          case 409:
            return ResponseErrorConflict(
              "EYCA Card is missing while citizen is eligible to obtain it or a CGN is already activated"
            );
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Start a CGN activation process for the logged user.
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
              pipe(
                response.headers.Location,
                O.fromNullable,
                O.getOrElse(() => "/api/v1/cgn/activation")
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
   * Get CGN activation status details for the logged user.
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
   * Start an EYCA activation for the logged user.
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
              pipe(
                response.headers.Location,
                O.fromNullable,
                O.getOrElse(() => "/api/v1/cgn/eyca/activation")
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

  /**
   * Get EYCA's activation status detail for the logged user.
   */
  public readonly getEycaActivation = (
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<EycaActivationDetail>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnApiClient.getEycaActivation({
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
              "No EYCA Card activation found"
            );
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Start a CGN unsubscription process for the logged user.
   */
  public readonly startCgnUnsubscription = (
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
      const validated = await this.cgnApiClient.startCgnUnsubscription({
        fiscalcode: user.fiscal_code
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 201:
            return ResponseSuccessRedirectToResource(
              response.value,
              pipe(
                response.headers.Location,
                O.fromNullable,
                O.getOrElse(() => "/api/v1/cgn/delete")
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
              "Cannot start a new CGN unsubscription"
            );
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * generate a CGN OTP
   */
  public readonly generateOtp = (
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<Otp>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnApiClient.generateOtp({
        fiscalcode: user.fiscal_code
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 403:
            return ResponseErrorForbiddenNotAuthorized;
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
