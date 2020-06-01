/**
 * This service interactsnwith the Bonus API
 */

import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  ProblemJson,
  ResponseErrorConflict,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessAccepted,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { EligibilityCheck } from "../../generated/io-bonus-api/EligibilityCheck";
import { InstanceId } from "../../generated/io-bonus-api/InstanceId";

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

export default class BonusService {
  constructor(private readonly bonusApiClient: ReturnType<BonusAPIClient>) {}

  /**
   * Starts the procedure to check if the current user is eligible for the bonus.
   */
  public readonly startBonusEligibilityCheck = (
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorConflict
    | IResponseSuccessJson<InstanceId>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.bonusApiClient.startBonusEligibilityCheck({
        fiscalCode: user.fiscal_code
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 409:
            return ResponseErrorConflict(readableProblem(response.value));
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          case 401:
            // This case can only happen because of misconfiguration, thus it might me considered an error
            return ResponseErrorInternal(
              "Underlying API fails with an unexpected 401"
            );
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
            // This case can only happen because of misconfiguration, thus it might me considered an error
            return ResponseErrorInternal(
              "Underlying API fails with an unexpected 401"
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
