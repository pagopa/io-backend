/**
 *
 */

import { isLeft } from "fp-ts/lib/Either";
import * as winston from "winston";
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

  public async getProfile(
    user: User
  ): Promise<ProfileWithoutEmail | ProfileWithEmail> {
    try {
      const profilePayload = await this.apiClient
        .getClient(user.fiscal_code)
        .getProfile();

      const maybeApiProfile = GetProfileOKResponse.decode(profilePayload);
      if (isLeft(maybeApiProfile)) {
        const maybeProblemJson = ProblemJson.decode(profilePayload);

        if (isLeft(maybeProblemJson)) {
          return Promise.reject(new Error("Unknown response."));
        }

        const problemJson = maybeProblemJson.value;

        // If the profile doesn't exists on the API we still
        // return 200 to the App with the information we have
        // retrieved from SPID.
        if (problemJson.status === 404) {
          return Promise.resolve(toAppProfileWithoutEmail(user));
        }

        return Promise.reject(new Error("Api error."));
      }

      const apiProfile = maybeApiProfile.value;
      return Promise.resolve(toAppProfileWithEmail(apiProfile, user));
    } catch (err) {
      winston.log("error", "Error occurred in API call: %s", err.message);
      return Promise.reject(Error("Error in calling the API."));
    }
  }

  public async upsertProfile(user: User, upsertProfile: ExtendedProfile) {
    try {
      const profilePayload = await this.apiClient
        .getClient(user.fiscal_code)
        .upsertProfile({ body: upsertProfile });

      const maybeApiProfile = UpsertProfileOKResponse.decode(profilePayload);
      if (isLeft(maybeApiProfile)) {
        const maybeProblemJson = ProblemJson.decode(profilePayload);

        if (isLeft(maybeProblemJson)) {
          return Promise.reject(new Error("Unknown response."));
        }

        return Promise.reject(new Error("Api error."));
      }

      const apiProfile = maybeApiProfile.value;
      return Promise.resolve(toAppProfileWithEmail(apiProfile, user));
    } catch (err) {
      winston.log("error", "Error occurred in API call: %s", err.message);
      return Promise.reject(new Error("Error in calling the API."));
    }
  }
}
