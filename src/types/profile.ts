/**
 * This file contains the ProfileWithEmail and ProfileWithoutEmail models and
 * some functions to validate and convert type to and from them.
 */

import { AuthenticatedProfile } from "../../generated/backend/AuthenticatedProfile";
import { InitializedProfile } from "../../generated/backend/InitializedProfile";

import { ExtendedProfile } from "../../generated/io-api/ExtendedProfile";

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { User } from "./user";

/**
 * Converts an existing ExtendedProfile to a Proxy profile.
 */
export const toInitializedProfile = (
  profile: ExtendedProfile,
  user: User
): InitializedProfile => ({
  accepted_tos_version: profile.accepted_tos_version,
  blocked_inbox_or_channels: profile.blocked_inbox_or_channels,
  email: profile.email,
  family_name: user.family_name,
  fiscal_code: user.fiscal_code,
  has_profile: true,
  is_email_validated: profile.is_email_validated,
  is_inbox_enabled: profile.is_inbox_enabled,
  is_webhook_enabled: profile.is_webhook_enabled,
  name: user.name,
  preferred_languages: profile.preferred_languages,
  spid_email: user.spid_email,
  spid_mobile_phone: user.spid_mobile_phone,
  version: profile.version
});

/**
 * Converts an authenticated User to an AuthenticatedProfile.
 */
export const toAuthenticatedProfile = (user: User): AuthenticatedProfile => ({
  family_name: user.family_name,
  fiscal_code: user.fiscal_code,
  has_profile: false,
  name: user.name,
  spid_email: user.spid_email,
  spid_mobile_phone: user.spid_mobile_phone
});

export const notFoundProfileToAuthenticatedProfile = (
  // tslint:disable-next-line: prettier
  response:
    // tslint:disable-next-line: max-union-size
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseErrorNotFound
    | IResponseSuccessJson<InitializedProfile>
    | IResponseSuccessJson<AuthenticatedProfile>,
  user: User
) => {
  if (response.kind === "IResponseErrorNotFound") {
    return ResponseSuccessJson(toAuthenticatedProfile(user));
  }
  return response;
};
