/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */

import { isLeft } from "fp-ts/lib/Either";
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

export default class ProfileService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves the profile for a specific user.
   */
  public getProfile(
    user: User
  ): Promise<ProfileWithoutEmail | ProfileWithEmail> {
    return new Promise(async (resolve, reject) => {
      const profilePayload = await this.apiClient
        .getClient(user.fiscal_code)
        .getProfile();

      const errorOrApiProfile = GetProfileOKResponse.decode(profilePayload);
      if (isLeft(errorOrApiProfile)) {
        const errorOrProblemJson = ProblemJson.decode(profilePayload);

        if (isLeft(errorOrProblemJson)) {
          return reject(new Error("Unknown response."));
        }

        const problemJson = errorOrProblemJson.value;

        // If the profile doesn't exists on the API we still
        // return 200 to the App with the information we have
        // retrieved from SPID.
        if (problemJson.status === 404) {
          return resolve(toAppProfileWithoutEmail(user));
        }

        return reject(new Error("Api error."));
      }

      const apiProfile = errorOrApiProfile.value;
      return resolve(toAppProfileWithEmail(apiProfile, user));
    });
  }

  /**
   * Upsert the profile of a specific user.
   */
  public upsertProfile(
    user: User,
    upsertProfile: ExtendedProfile
  ): Promise<ProfileWithEmail> {
    return new Promise(async (resolve, reject) => {
      const profilePayload = this.apiClient
        .getClient(user.fiscal_code)
        .upsertProfile({ body: upsertProfile });

      const errorOrApiProfile = UpsertProfileOKResponse.decode(profilePayload);
      if (isLeft(errorOrApiProfile)) {
        const errorOrProblemJson = ProblemJson.decode(profilePayload);

        if (isLeft(errorOrProblemJson)) {
          return reject(new Error("Unknown response."));
        }

        return reject(new Error("Api error."));
      }

      const apiProfile = errorOrApiProfile.value;
      return resolve(toAppProfileWithEmail(apiProfile, user));
    });
  }
}
