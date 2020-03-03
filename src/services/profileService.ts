/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorTooManyRequests,
  ResponseSuccessAccepted,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { ExtendedProfile as ExtendedProfileApi } from "../../generated/io-api/ExtendedProfile";
import { NewProfile } from "../../generated/io-api/NewProfile";
import { Profile as ProfileApi } from "../../generated/io-api/Profile";

import { InitializedProfile } from "../../generated/backend/InitializedProfile";
import { Profile as ProfileBackend } from "../../generated/backend/Profile";

import { errorsToReadableMessages } from "italia-ts-commons/lib/reporters";
import { toInitializedProfile } from "../types/profile";
import { User } from "../types/user";
import {
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

export default class ProfileService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves the profile for a specific user.
   */
  public readonly getProfile = (
    user: User
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseErrorNotFound
    | IResponseSuccessJson<InitializedProfile>
  > => {
    const client = this.apiClient.getClient();
    return withCatchAsInternalError(async () => {
      const validated = await client.getProfile({
        fiscalCode: user.fiscal_code
      });

      return withValidatedOrInternalError(validated, response => {
        if (response.status === 200) {
          // we need an ExtendedProfile (and that's what we should have got) but
          // since the response may be an ExtendedProfile or a LimitedProfile
          // depending on the credentials, we must decode it as an
          // ExtendedProfile to be sure it's what we need.
          const validatedExtendedProfile = ExtendedProfileApi.decode(
            response.value
          );

          return withValidatedOrInternalError(validatedExtendedProfile, p =>
            ResponseSuccessJson(toInitializedProfile(p, user))
          );
        }

        if (response.status === 404) {
          return ResponseErrorNotFound("Not Found", "Profile not found");
        }

        // The user has sent too many requests in a given amount of time ("rate limiting").
        if (response.status === 429) {
          return ResponseErrorTooManyRequests();
        }

        return unhandledResponseStatus(response.status);
      });
    });
  };

  public readonly getApiProfile = (
    user: User
  ): Promise<
    // tslint:disable-next-line: max-union-size
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseErrorNotFound
    | IResponseSuccessJson<ExtendedProfileApi>
  > => {
    const client = this.apiClient.getClient();
    return withCatchAsInternalError(async () => {
      const validated = await client.getProfile({
        fiscalCode: user.fiscal_code
      });
      return withValidatedOrInternalError(validated, response => {
        if (response.status === 200) {
          return ExtendedProfileApi.decode(response.value).fold<
            IResponseSuccessJson<ExtendedProfileApi> | IResponseErrorInternal
          >(
            _ => ResponseErrorInternal(errorsToReadableMessages(_).join(" / ")),
            _ => ResponseSuccessJson(_)
          );
        }
        // The profile doesn't exists for the user
        if (response.status === 404) {
          return ResponseErrorNotFound("Not found", "Profile not found.");
        }

        // The user has sent too many requests in a given amount of time ("rate limiting").
        if (response.status === 429) {
          return ResponseErrorTooManyRequests();
        }

        return unhandledResponseStatus(response.status);
      });
    });
  };

  /**
   * Create the profile of a specific user.
   */
  public readonly createProfile = async (
    user: User,
    newProfile: NewProfile
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<InitializedProfile>
  > => {
    const client = this.apiClient.getClient();
    return withCatchAsInternalError(async () => {
      const validated = await client.createProfile({
        fiscalCode: user.fiscal_code,
        newProfile
      });

      return withValidatedOrInternalError(validated, response =>
        response.status === 200
          ? ResponseSuccessJson(toInitializedProfile(response.value, user))
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : unhandledResponseStatus(response.status)
      );
    });
  };

  /**
   * Upsert the profile of a specific user.
   */
  public readonly updateProfile = async (
    user: User,
    profileBackend: ProfileBackend
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<InitializedProfile>
  > => {
    const client = this.apiClient.getClient();
    return withValidatedOrInternalError(
      // we need to convert the ExtendedProfile from the backend specs to the
      // ExtendedProfile model of the API specs - this decode should always
      // succeed as the models should be exactly the same
      ProfileApi.decode(profileBackend),
      async extendedProfileApi =>
        withCatchAsInternalError(async () => {
          const validated = await client.updateProfile({
            fiscalCode: user.fiscal_code,
            profile: extendedProfileApi
          });

          return withValidatedOrInternalError(validated, response =>
            response.status === 200
              ? ResponseSuccessJson(toInitializedProfile(response.value, user))
              : response.status === 404
              ? ResponseErrorNotFound("Not found", "User not found")
              : response.status === 429
              ? ResponseErrorTooManyRequests()
              : unhandledResponseStatus(response.status)
          );
        })
    );
  };

  /**
   * Resend the email to complete email validation process
   */
  public readonly emailValidationProcess = async (
    user: User
  ): Promise<
    // tslint:disable-next-line: max-union-size
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseErrorNotFound
    | IResponseSuccessAccepted
  > => {
    const client = this.apiClient.getClient();
    return withCatchAsInternalError(async () => {
      const validated = await client.emailValidationProcess({
        fiscalCode: user.fiscal_code
      });
      return withValidatedOrInternalError(validated, response => {
        return response.status === 202
          ? ResponseSuccessAccepted()
          : response.status === 404
          ? ResponseErrorNotFound("Not found", "User not found.")
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : unhandledResponseStatus(response.status);
      });
    });
  };
}
