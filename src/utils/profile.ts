import { IResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { EmailAddress } from "../../generated/backend/EmailAddress";
import { InitializedProfile } from "../../generated/backend/InitializedProfile";
import ProfileService from "../../src/services/profileService";
import { User } from "../../src/types/user";

// define a type that represents a Profile with a non optional email address
const ProfileWithEmail = t.intersection([
  t.type({
    email: EmailAddress
  }),
  InitializedProfile
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
        E.mapLeft(() => new Error("Profile has not a validated email address")),
        TE.fromEither
      )
    )
  );
