/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */

import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseSuccessJson,
  ResponseErrorConflict,
  ResponseErrorNotFound,
  ResponseErrorTooManyRequests,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { fromNullable } from "fp-ts/lib/Option";
import { UserDataProcessing } from "generated/io-api/UserDataProcessing";
import { UserDataProcessingChoice } from "generated/io-api/UserDataProcessingChoice";
import { UserDataProcessingChoiceRequest } from "generated/io-api/UserDataProcessingChoiceRequest";
import { User } from "../types/user";
import {
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

export default class UserDataProcessingService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Create the user data processing of a specific user.
   */
  public readonly upsertUserDataProcessing = async (
    user: User,
    userDataProcessingChoiceRequest: UserDataProcessingChoiceRequest
  ): Promise<
    // tslint:disable-next-line: max-union-size
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseErrorConflict
    | IResponseSuccessJson<UserDataProcessing>
  > => {
    const client = this.apiClient.getClient();
    return withCatchAsInternalError(async () => {
      const validated = await client.upsertUserDataProcessing({
        fiscal_code: user.fiscal_code,
        body: userDataProcessingChoiceRequest
      });

      return withValidatedOrInternalError(validated, response =>
        response.status === 200
          ? ResponseSuccessJson(response.value)
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : response.status === 409
          ? ResponseErrorConflict(
              fromNullable(response.value.detail).getOrElse("Conflict")
            )
          : unhandledResponseStatus(response.status)
      );
    });
  };

  /**
   * Get the user data processing of a specific user.
   */
  public readonly getUserDataProcessing = async (
    user: User,
    userDataProcessingChoiceParam: UserDataProcessingChoice
  ): Promise<
    // tslint:disable-next-line: max-union-size
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseErrorNotFound
    | IResponseSuccessJson<UserDataProcessing>
  > => {
    const client = this.apiClient.getClient();
    return withCatchAsInternalError(async () => {
      const validated = await client.getUserDataProcessing({
        fiscal_code: user.fiscal_code,
        choice: userDataProcessingChoiceParam
      });

      return withValidatedOrInternalError(validated, response =>
        response.status === 200
          ? ResponseSuccessJson(response.value)
          : response.status === 404
          ? ResponseErrorNotFound("Not Found", "User data processing not found")
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : unhandledResponseStatus(response.status)
      );
    });
  };
}
