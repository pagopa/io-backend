/**
 * This service interactsnwith the Bonus API
 */

import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  IResponseSuccessRedirectToResource,
  ProblemJson,
  ResponseErrorConflict,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponseSuccessAccepted,
  ResponseSuccessJson,
  ResponseSuccessRedirectToResource
} from "italia-ts-commons/lib/responses";

import { EligibilityCheck } from "../../generated/io-bonus-api/EligibilityCheck";
import { InstanceId } from "../../generated/io-bonus-api/InstanceId";

import { BonusActivation } from "generated/io-bonus-api/BonusActivation";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { BonusAPIClient } from "../clients/bonus";
import { User } from "../types/user";
import {
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";

const readableProblem = (problem: ProblemJson) =>
  `${problem.title} (${problem.type || "no problem type specified"})`;

const ResponseErrorStatusNotDefinedInSpec = (response: never) =>
  // This case should not happen, so response is of type never.
  // However, the underlying api may not follow the specs so we might trace the unhandled status
  // tslint:disable-next-line: no-any
  unhandledResponseStatus((response as any).status);

const ResponseErrorUnexpectedAuthProblem = () =>
  // This case can only happen because of misconfiguration, thus it might be considered an error
  ResponseErrorInternal("Underlying API fails with an unexpected 401");

export default class BonusService {
  constructor(private readonly bonusApiClient: ReturnType<BonusAPIClient>) {}

  /**
   * Starts the procedure to check if the current user is eligible for the bonus.
   */
  public readonly startBonusEligibilityCheck = (
    user: User
  ): Promise<
    // tslint:disable-next-line: max-union-size
    | IResponseErrorInternal
    | IResponseErrorConflict
    | IResponseErrorValidation
    | IResponseSuccessAccepted
    | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.bonusApiClient.startBonusEligibilityCheck({
        fiscalCode: user.fiscal_code
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 201:
            return ResponseSuccessRedirectToResource(
              response.value,
              response.headers.Location || "",
              response.value
            );
          case 202:
            return ResponseSuccessAccepted();
          case 409:
            return ResponseErrorConflict(readableProblem(response.value));
          case 403:
            return ResponseErrorValidation(
              "Bad Request",
              "Already an active bonus related to this user"
            );
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Retrieve the status of an eligibility check previously started
   */
  public readonly getBonusEligibilityCheck = (
    user: User
  ): Promise<
    // tslint:disable-next-line: max-union-size
    | IResponseErrorInternal
    | IResponseSuccessAccepted
    | IResponseErrorNotFound
    | IResponseSuccessJson<EligibilityCheck>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.bonusApiClient.getBonusEligibilityCheck({
        fiscalCode: user.fiscal_code
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 202:
            return ResponseSuccessAccepted();
          case 404:
            return ResponseErrorNotFound(
              "EligibilityCheck not found",
              `Could not find an eligibility check for fiscal code ${user.fiscal_code}`
            );
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Retrieve a bonus activation detail decorated with its qr-code images generated at runtime.
   */
  public readonly getLatestBonusActivationById = (
    user: User,
    bonusId: NonEmptyString
  ): Promise<
    // tslint:disable-next-line: max-union-size
    | IResponseErrorInternal
    | IResponseSuccessAccepted
    | IResponseErrorNotFound
    | IResponseSuccessJson<BonusActivation>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.bonusApiClient.getLatestBonusActivationById({
        bonus_id: bonusId,
        fiscalCode: user.fiscal_code
      });

      // tslint:disable-next-line: no-identical-functions
      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            // TODO: aggiungere qr code
            return ResponseSuccessJson(response.value);
          case 404:
            return ResponseErrorNotFound(
              "BonusActivation not found",
              `Could not find a bonus activation for fiscal code: ${user.fiscal_code} and bonus id ${bonusId}`
            );
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
