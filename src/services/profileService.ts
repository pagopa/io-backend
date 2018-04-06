/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */

import { isLeft } from "fp-ts/lib/Either";
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
import APIServiceBase from "./APIServiceBase";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

export default class ProfileService extends APIServiceBase {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {
    super();
  }

  /**
   * Retrieves the profile for a specific user.
   */
  public async getProfile(
    user: User
  ): Promise<ProfileWithoutEmail | ProfileWithEmail> {
    const httpOperationResponse = await this.apiClient
      .getClient(user.fiscal_code)
      .getProfileWithHttpOperationResponse();

    const profilePayload = this.extractBodyFromResponse(httpOperationResponse);
    const status = this.extractStatusFromResponse(httpOperationResponse);

    if (status !== 200) {
      const errorOrProblemJson = ProblemJson.decode(profilePayload);
      if (isLeft(errorOrProblemJson)) {
        throw this.unknownResponseError(errorOrProblemJson, "getProfile");
      }

      if (status !== 404) {
        throw this.apiError(profilePayload, "getProfile");
      } else {
        // If the profile doesn't exists on the API we still
        // return 200 to the App with the information we have
        // retrieved from SPID.
        return toAppProfileWithoutEmail(user);
      }
    }

    const errorOrApiProfile = GetProfileOKResponse.decode(profilePayload);
    if (isLeft(errorOrApiProfile)) {
      throw this.unknownResponseError(errorOrApiProfile, "getProfile");
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
    const httpOperationResponse = await this.apiClient
      .getClient(user.fiscal_code)
      .upsertProfileWithHttpOperationResponse(upsertOptions);

    const profilePayload = this.extractBodyFromResponse(httpOperationResponse);
    const status = this.extractStatusFromResponse(httpOperationResponse);

    if (status !== 200) {
      const errorOrProblemJson = ProblemJson.decode(profilePayload);
      if (isLeft(errorOrProblemJson)) {
        throw this.unknownResponseError(errorOrProblemJson, "upsertProfile");
      } else {
        throw this.apiError(profilePayload, "upsertProfile");
      }
    }

    const errorOrApiProfile = UpsertProfileOKResponse.decode(profilePayload);
    if (isLeft(errorOrApiProfile)) {
      throw this.unknownResponseError(errorOrApiProfile, "upsertProfile");
    }

    const apiProfile = errorOrApiProfile.value;
    return toAppProfileWithEmail(apiProfile, user);
  }
}
