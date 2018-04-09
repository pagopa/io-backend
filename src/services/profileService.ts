/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */

import { isLeft } from "fp-ts/lib/Either";
import * as winston from "winston";
import { DigitalCitizenshipAPIUpsertProfileOptionalParams } from "../api/models";
import { ProblemJson } from "../types/api/ProblemJson";
import { ExtendedProfile } from "../types/api_client/extendedProfile";
import { GetProfileOKResponse } from "../types/api_client/getProfileOKResponse";
import { UpsertProfileOKResponse } from "../types/api_client/upsertProfileOKResponse";
import {
  ProfileWithEmail,
  ProfileWithoutEmail,
  toAppProfileWithEmail,
  toAppProfileWithoutEmail
} from "../types/profile";
import { User } from "../types/user";
import SimpleHttpOperationResponse from "../utils/simpleResponse";
import { ReadableReporter } from "../utils/validation_reporters";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

const profileErrorOnUnknownResponse = "Unknown response.";
const profileErrorOnApiError = "Api error.";

export default class ProfileService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves the profile for a specific user.
   */
  public async getProfile(
    user: User
  ): Promise<ProfileWithoutEmail | ProfileWithEmail> {
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
        throw new Error(profileErrorOnUnknownResponse);
      }

      if (!simpleResponse.isNotFound()) {
        throw new Error(profileErrorOnApiError);
      } else {
        // If the profile doesn't exists on the API we still
        // return 200 to the App with the information we have
        // retrieved from SPID.
        return toAppProfileWithoutEmail(user);
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
      throw new Error(profileErrorOnUnknownResponse);
    }

    const apiProfile = errorOrApiProfile.value;
    return toAppProfileWithEmail(apiProfile, user);
  }

  /**
   * Upsert the profile of a specific user.
   */
  public async upsertProfile(
    user: User,
    upsertProfile: ExtendedProfile
  ): Promise<ProfileWithEmail> {
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
        throw new Error(profileErrorOnUnknownResponse);
      } else {
        throw new Error(profileErrorOnApiError);
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
      throw new Error(profileErrorOnUnknownResponse);
    }

    const apiProfile = errorOrApiProfile.value;
    return toAppProfileWithEmail(apiProfile, user);
  }
}
