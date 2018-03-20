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
import { IApiClientFactoryInterface } from "./iApiClientFactory";

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
    const profilePayload = await this.apiClient
      .getClient(user.fiscal_code)
      .getProfile();

    const errorOrApiProfile = GetProfileOKResponse.decode(profilePayload);
    if (isLeft(errorOrApiProfile)) {
      const errorOrProblemJson = ProblemJson.decode(profilePayload);

      if (isLeft(errorOrProblemJson)) {
        winston.log(
          "error",
          "Unknown response from getProfile API:",
          profilePayload
        );
        throw new Error(profileErrorOnUnknownResponse);
      } else {
        const problemJson = errorOrProblemJson.value;

        // If the profile doesn't exists on the API we still
        // return 200 to the App with the information we have
        // retrieved from SPID.
        if (problemJson.status === 404) {
          return toAppProfileWithoutEmail(user);
        }

        winston.log("error", "API error in getProfile: %s", profilePayload);
        throw new Error(profileErrorOnApiError);
      }
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
    const profilePayload = await this.apiClient
      .getClient(user.fiscal_code)
      .upsertProfile(upsertOptions);

    const errorOrApiProfile = UpsertProfileOKResponse.decode(profilePayload);
    if (isLeft(errorOrApiProfile)) {
      const errorOrProblemJson = ProblemJson.decode(profilePayload);

      if (isLeft(errorOrProblemJson)) {
        winston.log(
          "error",
          "Unknown response from upsertProfile API:",
          profilePayload
        );
        throw new Error(profileErrorOnUnknownResponse);
      } else {
        winston.log("error", "API error in upsertProfile:", profilePayload);
        throw new Error(profileErrorOnApiError);
      }
    }

    const apiProfile = errorOrApiProfile.value;
    return toAppProfileWithEmail(apiProfile, user);
  }
}
