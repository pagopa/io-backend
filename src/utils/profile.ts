import { InitializedProfile } from "../../generated/backend/InitializedProfile";
import ProfileService from "../../src/services/profileService";
import { User } from "../../src/types/user";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { ResponseErrorInternal } from "@pagopa/ts-commons/lib/responses";
import { pipe } from "fp-ts/lib/function";
import { EmailAddress } from "../../generated/io-api/EmailAddress";

// define a type that represents a Profile with a non optional email address
const ProfileWithEmailAddress = t.intersection([
  t.interface({
    email: EmailAddress
  }),
  InitializedProfile
]);

type ProfileWithEmailAddress = t.TypeOf<typeof ProfileWithEmailAddress>;

// define a branded type that ensure we have the email in the profile and
// that it is not undefined
interface IProfileWithValidNameAndEmailAddressTag {
  readonly HasValidEmailAddress: unique symbol;
}

const ProfileWithValidNameAndEmailAddress = t.brand(
  ProfileWithEmailAddress,
  (
    p
  ): p is t.Branded<
    ProfileWithEmailAddress,
    IProfileWithValidNameAndEmailAddressTag
  > => !!(p.email && p.is_email_validated),
  "HasValidEmailAddress"
);

type ProfileWithValidNameAndEmailAddress = t.TypeOf<
  typeof ProfileWithValidNameAndEmailAddress
>;

/**
 * Gets a profile with a valid email
 * @param profileService
 * @param user
 * @returns
 */
export const profileWithValidatedEmailAddressOrError = (
  profileService: ProfileService,
  user: User
) =>
  pipe(
    TE.tryCatch(
      () => profileService.getProfile(user),
      () => ResponseErrorInternal("Error retrieving user profile")
    ),
    TE.chain(r =>
      r.kind === "IResponseSuccessJson" ? TE.of(r.value) : TE.left(r)
    ),
    TE.chainW(profile =>
      pipe(
        profile,
        ProfileWithValidNameAndEmailAddress.decode,
        E.mapLeft(_ =>
          ResponseErrorInternal("User does not have a valid email address")
        ),
        TE.fromEither
      )
    )
  );
