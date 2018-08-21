/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */

import { Either, left, right } from "fp-ts/lib/Either";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { ExtendedProfile } from "../types/api/ExtendedProfile";
import { ProfileWithEmail } from "../types/api/ProfileWithEmail";
import { ProfileWithoutEmail } from "../types/api/ProfileWithoutEmail";
import { internalError, ServiceError } from "../types/error";
import {
  toAppProfileWithEmail,
  toAppProfileWithoutEmail
} from "../types/profile";
import { User } from "../types/user";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

const profileErrorOnUnknownResponse = "Unknown response.";
const profileErrorOnApiError = "Api error.";

export type profileResponse<T> =
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseSuccessJson<T>;

export default class ProfileService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves the profile for a specific user.
   */
  public async getProfile(
    user: User
  ): Promise<Either<ServiceError, ProfileWithoutEmail | ProfileWithEmail>> {
    try {
      const client = this.apiClient.getClient();

      const res = await client.getProfile({
        fiscalCode: user.fiscal_code
      });

      // The response is undefined (can't be decoded).
      if (!res) {
        return left(internalError(profileErrorOnUnknownResponse));
      }

      // The response is correct.
      if (res.status === 200) {
        return right(toAppProfileWithEmail(res.value, user));
      }

      // If the profile doesn't exists on the API we still
      // return 200 to the App with the information we have
      // retrieved from SPID.
      if (res.status === 404) {
        return right(toAppProfileWithoutEmail(user));
      } else {
        return left(internalError(profileErrorOnApiError));
      }
    } catch (e) {
      return left(internalError(profileErrorOnUnknownResponse));
    }
  }

  /**
   * Upsert the profile of a specific user.
   */
  public async upsertProfile(
    user: User,
    upsertProfile: ExtendedProfile
  ): Promise<Either<ServiceError, ProfileWithEmail>> {
    try {
      const client = this.apiClient.getClient();

      const res = await client.createOrUpdateProfile({
        fiscalCode: user.fiscal_code,
        newProfile: upsertProfile
      });

      // If the response is undefined (can't be decoded) or the status is not 200 dispatch a failure action.
      if (!res || res.status !== 200) {
        return right(toAppProfileWithEmail(res.value, user));
      } else {
        return left(internalError(profileErrorOnUnknownResponse));
      }
    } catch (e) {
      return left(internalError(profileErrorOnUnknownResponse));
    }
  }
}
