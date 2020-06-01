/**
 * This service interactsnwith the Bonus API
 */

import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseSuccessJson,
  ProblemJson,
  ResponseErrorConflict,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

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
          case 202:
            return ResponseSuccessJson(response.value);
          case 409:
            return ResponseErrorConflict(readableProblem(response.value));
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return unhandledResponseStatus(response.status);
        }
      });
    });
}
