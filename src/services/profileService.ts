/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */
import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { DigitalCitizenshipAPIUpsertProfileOptionalParams } from "../clients/api/models";
import { ProblemJson } from "../types/api/ProblemJson";
import { Profile } from "../types/api/Profile";
import { ExtendedProfile } from "../types/api_client/extendedProfile";
import { GetProfileOKResponse } from "../types/api_client/getProfileOKResponse";
import { UpsertProfileOKResponse } from "../types/api_client/upsertProfileOKResponse";
import { internalError, ServiceError } from "../types/error";
import {
  toAppProfileWithCDData,
  toProfileWithoutCDData
} from "../types/profile";
import { User } from "../types/user";
import { log } from "../utils/logger";
import SimpleHttpOperationResponse from "../utils/simpleResponse";
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
  public async getProfile(user: User): Promise<Either<ServiceError, Profile>> {
    const response = await this.apiClient
      .getClient(user.fiscal_code)
      .getProfileWithHttpOperationResponse();

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      const errorOrProblemJson = ProblemJson.decode(
        simpleResponse.parsedBody()
      );
      if (isLeft(errorOrProblemJson)) {
        log.error(
          "Unknown response from getProfile API: %s",
          ReadableReporter.report(errorOrProblemJson)
        );
        return left(internalError(profileErrorOnUnknownResponse));
      }

      if (simpleResponse.isNotFound()) {
        // If the profile doesn't exists on the API we still
        // return 200 to the App with the information we have
        // retrieved from SPID.
        return right(toProfileWithoutCDData(user));
      } else {
        return left(internalError(profileErrorOnApiError));
      }
    }

    const errorOrApiProfile = GetProfileOKResponse.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrApiProfile)) {
      log.error(
        "Unknown response from getProfile API: %s",
        ReadableReporter.report(errorOrApiProfile)
      );
      return left(internalError(profileErrorOnUnknownResponse));
    }

    const apiProfile = errorOrApiProfile.value;
    return right(toAppProfileWithCDData(apiProfile, user));
  }

  /**
   * Upsert the profile of a specific user.
   */
  public async upsertProfile(
    user: User,
    upsertProfile: ExtendedProfile
  ): Promise<Either<ServiceError, Profile>> {
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
        log.error(
          "Unknown response from upsertProfile API: %s",
          ReadableReporter.report(errorOrProblemJson)
        );
        return left(internalError(profileErrorOnUnknownResponse));
      } else {
        return left(internalError(profileErrorOnApiError));
      }
    }

    const errorOrApiProfile = UpsertProfileOKResponse.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrApiProfile)) {
      log.error(
        "Unknown response from upsertProfile API: %s",
        ReadableReporter.report(errorOrApiProfile)
      );
      return left(internalError(profileErrorOnUnknownResponse));
    }

    const apiProfile = errorOrApiProfile.value;
    return right(toAppProfileWithCDData(apiProfile, user));
  }
}
