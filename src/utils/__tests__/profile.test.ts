import { describe, it } from "@jest/globals";

import { createNewProfile } from "../profile";

import { mockedUser } from "../../__mocks__/user_mock";
import { pipe } from "fp-ts/lib/function";

const { fiscal_code, spid_email } = mockedUser;

describe("createNewProfile", () => {
  it.each([
    [
      false,
      [],
      spid_email,
      { email: spid_email, is_test_profile: false, is_email_validated: true },
    ],
    [
      false,
      [fiscal_code],
      undefined,
      { email: undefined, is_test_profile: true, is_email_validated: false },
    ],
    [
      true,
      [],
      spid_email,
      { email: spid_email, is_test_profile: false, is_email_validated: false },
    ],
    [
      true,
      [],
      undefined,
      { email: undefined, is_test_profile: false, is_email_validated: false },
    ],
  ])(
    "creates the right NewProfile object, given FF_UNIQUE_EMAIL_ENFORCEMENT_ENABLED=%s, TEST_LOGIN_FISCAL_CODES=%j",
    (uniqueEmailEnforcement, testLoginFiscalCodes, email, expected) => {
      const newProfile = pipe(
        {
          testLoginFiscalCodes,
          FF_UNIQUE_EMAIL_ENFORCEMENT_ENABLED: () => uniqueEmailEnforcement,
        },
        createNewProfile(fiscal_code, email)
      );
      expect(newProfile).toStrictEqual(expected);
    }
  );
});
