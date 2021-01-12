/**
 * This service interactsnwith the Bonus API
 */

import {
  IResponseErrorGone,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  ProblemJson,
  ResponseErrorGone,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessAccepted,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { EligibilityCheck } from "../../generated/io-bonus-api/EligibilityCheck";
import { InstanceId } from "../../generated/io-bonus-api/InstanceId";

import { BonusActivationWithQrCode } from "generated/bonus/BonusActivationWithQrCode";
import { PaginatedBonusActivationsCollection } from "generated/io-bonus-api/PaginatedBonusActivationsCollection";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { BonusAPIClient } from "../clients/bonus";
import { User } from "../types/user";
import { withQrcode } from "../utils/qrcode";
import {
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";

import { toString } from "fp-ts/lib/function";

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
   * Retrieve the status of an eligibility check previously started
   */
  public readonly getBonusEligibilityCheck = (
    user: User
  ): Promise<
    // tslint:disable-next-line: max-union-size
    | IResponseErrorInternal
    | IResponseSuccessAccepted
    | IResponseErrorNotFound
    | IResponseErrorGone
    | IResponseSuccessJson<EligibilityCheck>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.bonusApiClient.getBonusEligibilityCheck({
        fiscalcode: user.fiscal_code
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 202:
            return ResponseSuccessAccepted();
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 404:
            return ResponseErrorNotFound(
              "EligibilityCheck not found",
              `Could not find an eligibility check for fiscal code ${user.fiscal_code}`
            );
          case 410:
            return ResponseErrorGone("EligibilityCheck expired");
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
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
    | IResponseSuccessAccepted<InstanceId>
    | IResponseErrorNotFound
    | IResponseSuccessJson<BonusActivationWithQrCode>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.bonusApiClient.getLatestBonusActivationById({
        bonus_id: bonusId,
        fiscalcode: user.fiscal_code
      });

      // tslint:disable-next-line: no-identical-functions
      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return withQrcode(response.value)
              .fold<
                | IResponseErrorInternal
                | IResponseSuccessJson<BonusActivationWithQrCode>
              >(
                err =>
                  ResponseErrorInternal(
                    `Cannot encode qrcode: ${toString(err)}`
                  ),
                bonus => ResponseSuccessJson(bonus)
              )
              .run();
          case 202:
            return ResponseSuccessAccepted();
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 404:
            return ResponseErrorNotFound(
              "BonusActivation not found",
              `Could not find a bonus activation for fiscal code: ${user.fiscal_code} and bonus id ${bonusId}`
            );
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   *  Get all IDs of the bonus activations requested by
   *  the authenticated user or by any between his family member
   */
  public readonly getAllBonusActivations = (
    user: User
  ): Promise<
    // tslint:disable-next-line: max-union-size
    | IResponseErrorInternal
    | IResponseSuccessJson<PaginatedBonusActivationsCollection>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.bonusApiClient.getAllBonusActivations({
        fiscalcode: user.fiscal_code
      });

      // tslint:disable-next-line: no-identical-functions
      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 500:
            return ResponseErrorInternal(readableProblem(response.value));
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
