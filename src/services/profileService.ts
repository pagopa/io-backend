/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */

import { Either, left, right } from "fp-ts/lib/Either";
import {
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson
} from "io-ts-commons/lib/responses";
import { AuthenticatedProfile } from "../types/api/AuthenticatedProfile";
import { InitializedProfile } from "../types/api/InitializedProfile";

import { readableReport } from "io-ts-commons/lib/reporters";
import { ExtendedProfile } from "../types/api/ExtendedProfile";
import { internalError, ServiceError } from "../types/error";
import { toAuthenticatedProfile, toInitializedProfile } from "../types/profile";
import { User } from "../types/user";
import { log } from "../utils/logger";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

const profileErrorOnUnknownError = "Unknown response.";
const profileErrorOnApiError = "Api error.";
const logErrorOnStatusNotOK = "Status is not 200 or 404: %s";
const logErrorOnDecodeError = "Response can't be decoded: %O";
const logErrorOnUnknownError = "Unknown error: %s";

export type profileResponse<T> =
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseErrorGeneric
  | IResponseSuccessJson<T>;

export default class ProfileService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves the profile for a specific user.
   */
  public async getProfile(
    user: User
  ): Promise<Either<ServiceError, AuthenticatedProfile | InitializedProfile>> {
    try {
      const client = this.apiClient.getClient();

      const res = await client.getProfile({
        fiscalCode: user.fiscal_code
      });

      // The response is undefined (can't be decoded).
      if (!res) {
        log.error(logErrorOnDecodeError, res);
        return left(internalError(profileErrorOnUnknownError));
      }

      // The response is correct.
      if (res.status === 200) {
        return ExtendedProfile.decode(res.value).bimap(
          errs => internalError(readableReport(errs)),
          profile => toInitializedProfile(profile, user)
        );
      }

      // If the profile doesn't exists on the API we still
      // return 200 to the App with the information we have
      // retrieved from SPID.
      if (res.status === 404) {
        return right(toAuthenticatedProfile(user));
      }

      // The API is returning an error.
      log.error(logErrorOnStatusNotOK, res.status);
      return left(internalError(profileErrorOnApiError));
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return left(internalError(profileErrorOnUnknownError));
    }
  }

  /**
   * Upsert the profile of a specific user.
   */
  public async upsertProfile(
    user: User,
    upsertProfile: ExtendedProfile
  ): Promise<Either<ServiceError, InitializedProfile | AuthenticatedProfile>> {
    try {
      const client = this.apiClient.getClient();

      const res = await client.createOrUpdateProfile({
        fiscalCode: user.fiscal_code,
        newProfile: upsertProfile
      });

      // If the response is undefined (can't be decoded) or the status is not 200 dispatch a failure action.
      if (!res) {
        log.error(logErrorOnDecodeError, res);
        return left(internalError(profileErrorOnApiError));
      }

      if (res.status === 200) {
        return right(toInitializedProfile(res.value, user));
      } else if (res.status === 404) {
        return right(toAuthenticatedProfile(user));
      } else {
        log.error(logErrorOnStatusNotOK, res.status);
        return left(internalError(profileErrorOnApiError));
      }
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return left(internalError(profileErrorOnUnknownError));
    }
  }
}
