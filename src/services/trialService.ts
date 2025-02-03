/**
 * This service retrieves messages from the API system using an API client.
 */
import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  IResponseSuccessRedirectToResource,
  ResponseErrorConflict,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponseSuccessAccepted,
  ResponseSuccessJson,
  ResponseSuccessRedirectToResource
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";
import { TrialSystemAPIClient } from "src/clients/trial-system.client";

import { Subscription } from "../../generated/trial-system/Subscription";
import { TrialId } from "../../generated/trial-system-api/TrialId";
import {
  ResponseErrorStatusNotDefinedInSpec,
  ResponseErrorUnexpectedAuthProblem,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";

export default class TrialService {
  constructor(
    private readonly apiClient: ReturnType<typeof TrialSystemAPIClient>
  ) {}

  /**
   * Subscribe a user to a specific trial.
   */
  public readonly createSubscription = async (
    userId: NonEmptyString,
    trialId: TrialId
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorConflict
    | IResponseSuccessAccepted
    | IResponseSuccessRedirectToResource<Subscription, Subscription>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.createSubscription({
        body: {
          userId
        },
        trialId
      });

      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 201:
            return pipe(
              {
                createdAt: response.value.createdAt,
                state: response.value.state,
                trialId: response.value.trialId
              },
              (resBody) =>
                ResponseSuccessRedirectToResource(
                  resBody,
                  `/api/v1/trials/${trialId}/subscriptions`,
                  resBody
                )
            );
          case 202:
            return ResponseSuccessAccepted();
          case 400:
            return ResponseErrorValidation(
              "Bad Request",
              pipe(
                response.value.detail,
                O.fromNullable,
                O.getOrElse(() => "Malformed request")
              )
            );
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 404:
            return ResponseErrorNotFound("Not Found", "Trial not found");
          case 409:
            return ResponseErrorConflict("The resource already exists.");
          case 500:
            return ResponseErrorInternal(
              pipe(
                response.value.detail,
                O.fromNullable,
                O.getOrElse(() => "Cannot create subscription")
              )
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Get the subscription given a specific trial and user.
   */
  public readonly getSubscription = async (
    userId: NonEmptyString,
    trialId: TrialId
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<Subscription>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.getSubscription({
        trialId,
        userId
      });

      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 200:
            return pipe(
              {
                createdAt: response.value.createdAt,
                state: response.value.state,
                trialId: response.value.trialId
              },
              ResponseSuccessJson
            );
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 404:
            return ResponseErrorNotFound("Not Found", "Trial not found");
          case 500:
            return ResponseErrorInternal(
              pipe(
                response.value.detail,
                O.fromNullable,
                O.getOrElse(() => "Cannot get subscription")
              )
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
