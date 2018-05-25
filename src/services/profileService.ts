/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */

import { isLeft } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import * as winston from "winston";
import { DigitalCitizenshipAPIUpsertProfileOptionalParams } from "../api/models";
import { ProblemJson } from "../types/api/ProblemJson";
import { ProfileWithEmail } from "../types/api/ProfileWithEmail";
import { ProfileWithoutEmail } from "../types/api/ProfileWithoutEmail";
import { ExtendedProfile } from "../types/api_client/extendedProfile";
import { GetProfileOKResponse } from "../types/api_client/getProfileOKResponse";
import { UpsertProfileOKResponse } from "../types/api_client/upsertProfileOKResponse";
import {
  toAppProfileWithEmail,
  toAppProfileWithoutEmail
} from "../types/profile";
import { User } from "../types/user";
import SimpleHttpOperationResponse from "../utils/simpleResponse";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

const profileErrorOnUnknownResponse = "Unknown response.";
const profileErrorOnApiError = "Api error.";

export type profileResponse<T> =
  | IResponseErrorInternal
  | IResponseSuccessJson<T>;

export default class ProfileService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves the profile for a specific user.
   */
  public async getProfile(
    user: User
  ): Promise<profileResponse<ProfileWithoutEmail | ProfileWithEmail>> {
    const response = await this.apiClient
      .getClient(user.fiscal_code)
      .getProfileWithHttpOperationResponse();

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      const errorOrProblemJson = ProblemJson.decode(
        simpleResponse.parsedBody()
      );
      if (isLeft(errorOrProblemJson)) {
        winston.error(
          "Unknown response from getProfile API: %s",
          ReadableReporter.report(errorOrProblemJson)
        );
        return ResponseErrorInternal(profileErrorOnUnknownResponse);
      }

      if (simpleResponse.isNotFound()) {
        // If the profile doesn't exists on the API we still
        // return 200 to the App with the information we have
        // retrieved from SPID.
        return ResponseSuccessJson(toAppProfileWithoutEmail(user));
      } else {
        return ResponseErrorInternal(profileErrorOnApiError);
      }
    }

    const errorOrApiProfile = GetProfileOKResponse.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrApiProfile)) {
      winston.error(
        "Unknown response from getProfile API: %s",
        ReadableReporter.report(errorOrApiProfile)
      );
      return ResponseErrorInternal(profileErrorOnUnknownResponse);
    }

    const apiProfile = errorOrApiProfile.value;
    return ResponseSuccessJson(toAppProfileWithEmail(apiProfile, user));
  }

  /**
   * Upsert the profile of a specific user.
   */
  public async upsertProfile(
    user: User,
    upsertProfile: ExtendedProfile
  ): Promise<profileResponse<ProfileWithEmail>> {
    const upsertOptions: DigitalCitizenshipAPIUpsertProfileOptionalParams = {
      body: upsertProfile
    };
    const response = await this.apiClient
      .getClient(user.fiscal_code)
      .upsertProfileWithHttpOperationResponse(upsertOptions);

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      const errorOrProblemJson = ProblemJson.decode(
        simpleResponse.parsedBody()
      );
      if (isLeft(errorOrProblemJson)) {
        winston.error(
          "Unknown response from upsertProfile API: %s",
          ReadableReporter.report(errorOrProblemJson)
        );
        return ResponseErrorInternal(profileErrorOnUnknownResponse);
      } else {
        return ResponseErrorInternal(profileErrorOnApiError);
      }
    }

    const errorOrApiProfile = UpsertProfileOKResponse.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrApiProfile)) {
      winston.error(
        "Unknown response from upsertProfile API: %s",
        ReadableReporter.report(errorOrApiProfile)
      );
      return ResponseErrorInternal(profileErrorOnUnknownResponse);
    }

    const apiProfile = errorOrApiProfile.value;
    return ResponseSuccessJson(toAppProfileWithEmail(apiProfile, user));
  }
}
