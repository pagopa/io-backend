import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { IResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { pipe } from "fp-ts/lib/function";
import { EmailAddress } from "@pagopa/io-functions-app-sdk/EmailAddress";
import { User } from "../../src/types/user";
import ProfileService from "../../src/services/profileService";
import { InitializedProfile } from "../../generated/backend/InitializedProfile";
import { NewProfile } from "@pagopa/io-functions-app-sdk/NewProfile";

import { EmailString, FiscalCode } from "@pagopa/ts-commons/lib/strings";

// define a type that represents a Profile with a non optional email address
const ProfileWithEmail = t.intersection([
  t.interface({
    email: EmailAddress,
  }),
  InitializedProfile,
]);

type ProfileWithEmail = t.TypeOf<typeof ProfileWithEmail>;

// define a branded type that ensure we have the email in the profile and
// that it is not undefined
interface IProfileWithEmailValidatedTag {
  readonly HasValidEmailAddress: unique symbol;
}

const ProfileWithEmailValidated = t.brand(
  ProfileWithEmail,
  (p): p is t.Branded<ProfileWithEmail, IProfileWithEmailValidatedTag> =>
    !!(p.email && p.is_email_validated),
  "HasValidEmailAddress"
);

type ProfileWithEmailValidated = t.TypeOf<typeof ProfileWithEmailValidated>;

/**
 * Gets a profile with a valid email
 *
 * @param profileService
 * @param user
 * @returns
 */
export const profileWithEmailValidatedOrError = (
  profileService: ProfileService,
  user: User
) =>
  pipe(
    TE.tryCatch(
      () => profileService.getProfile(user),
      () => new Error("Error retrieving user profile")
    ),
    TE.chain(
      TE.fromPredicate(
        (r): r is IResponseSuccessJson<InitializedProfile> =>
          r.kind === "IResponseSuccessJson",
        (e) => new Error(`Error retrieving user profile | ${e.detail}`)
      )
    ),
    TE.chainW((profile) =>
      pipe(
        profile.value,
        ProfileWithEmailValidated.decode,
        E.mapLeft(
          (_) => new Error("Profile has not a validated email address")
        ),
        TE.fromEither
      )
    )
  );

type CreateNewProfileDependencies = {
  testLoginFiscalCodes: ReadonlyArray<FiscalCode>;
  FF_UNIQUE_EMAIL_ENFORCEMENT_ENABLED: (fiscalCode: FiscalCode) => boolean;
};

export const createNewProfile =
  (fiscalCode: FiscalCode, spidEmail?: EmailString) =>
  (r: CreateNewProfileDependencies): NewProfile => {
    let isEmailValidated = false;
    // --------------------
    // If the specified user is NOT eligible for the unique email enforcement
    // set isEmailValidated true if there is a SPID email, otherwhise set false.
    if (r.FF_UNIQUE_EMAIL_ENFORCEMENT_ENABLED(fiscalCode) === false) {
      isEmailValidated = spidEmail ? true : false;
    }
    // --------------------
    const isTestProfile = r.testLoginFiscalCodes.includes(fiscalCode);
    return {
      email: spidEmail,
      is_email_validated: isEmailValidated,
      is_test_profile: isTestProfile,
    };
  };
