/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */

import { Either, left, right } from "fp-ts/lib/Either";
import { readableReport } from "italia-ts-commons/lib/reporters";

import { AuthenticatedProfile } from "@generated/backend/AuthenticatedProfile";
import { InitializedProfile } from "@generated/backend/InitializedProfile";

import { ExtendedProfile } from "@generated/io-api/ExtendedProfile";

import {
  unhandledResponseStatus,
  withCatchAsInternalError
} from "src/utils/responses";
import { internalError, ServiceError } from "../types/error";
import { toAuthenticatedProfile, toInitializedProfile } from "../types/profile";
import { User } from "../types/user";
import { IApiClientFactoryInterface } from "./IApiClientFactory";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

export default class ProfileService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves the profile for a specific user.
   */
  public async getProfile(
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseSuccessJson<AuthenticatedProfile>
    | IResponseSuccessJson<InitializedProfile>
  > {
    return withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const res = await client.getProfile({
        fiscalCode: user.fiscal_code
      });

      // The response can't be decoded
      if (res.isLeft()) {
        return ResponseErrorInternal(readableReport(res.value));
      }

      // The response is correct.
      if (res.value.status === 200) {
        // since the response may be an ExtendedProfile or a LimitedProfile
        // we must try to decode it as an ExtendedProfile
        const extendedProfileOrErrors = ExtendedProfile.decode(res.value);
        if (extendedProfileOrErrors.isLeft()) {
          return ResponseErrorInternal(
            readableReport(extendedProfileOrErrors.value)
          );
        }
        const initializedProfile = toInitializedProfile(
          extendedProfileOrErrors.value,
          user
        );
        return ResponseSuccessJson(initializedProfile);
      }

      // If the profile doesn't exists on the API we still
      // return 200 to the App with the information we have
      // retrieved from SPID.
      if (res.value.status === 404) {
        return ResponseSuccessJson(toAuthenticatedProfile(user));
      }

      return unhandledResponseStatus(res.value.status);
    });
  }

  /**
   * Upsert the profile of a specific user.
   */
  public async upsertProfile(
    user: User,
    upsertProfile: ExtendedProfile
  ): Promise<Either<ServiceError, InitializedProfile | AuthenticatedProfile>> {
    return withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const res = await client.upsertProfile({
        extendedProfile: upsertProfile,
        fiscalCode: user.fiscal_code
      });

      // The response can't be decoded
      if (res.isLeft()) {
        return left(internalError(readableReport(res.value)));
      }

      if (res.value.status === 200) {
        return right(toInitializedProfile(res.value, user));
      }

      if (res.value.status === 404) {
        return right(toAuthenticatedProfile(user));
      }

      return unhandledResponseStatus(res.value.status);
    });
  }
}
