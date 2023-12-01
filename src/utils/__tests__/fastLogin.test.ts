import { LoginTypeEnum, getLoginType } from "../fastLogin";

describe("fastLogin|>getIsUserElegibleForfastLogin", () => {
  it.each`
    loginType               | isUserElegibleForFastLogin | expectedResult
    ${undefined}            | ${false}                   | ${LoginTypeEnum.LEGACY}
    ${undefined}            | ${true}                    | ${LoginTypeEnum.LEGACY}
    ${LoginTypeEnum.LEGACY} | ${false}                   | ${LoginTypeEnum.LEGACY}
    ${LoginTypeEnum.LEGACY} | ${true}                    | ${LoginTypeEnum.LEGACY}
    ${LoginTypeEnum.LV}     | ${false}                   | ${LoginTypeEnum.LEGACY}
    ${LoginTypeEnum.LV}     | ${true}                    | ${LoginTypeEnum.LV}
  `(
    "should return $expectedResult when loginType is $loginType, user is eligible for fast-login $isUserEligibleForFastLogin and lollipop is enabled",
    async ({ loginType, isUserElegibleForFastLogin, expectedResult }) => {
      const result = getLoginType(loginType, isUserElegibleForFastLogin, true);

      expect(result).toEqual(expectedResult);
    }
  );

  it.each`
    loginType               | isUserElegibleForFastLogin
    ${undefined}            | ${false}
    ${undefined}            | ${true}
    ${LoginTypeEnum.LEGACY} | ${false}
    ${LoginTypeEnum.LEGACY} | ${true}
    ${LoginTypeEnum.LV}     | ${false}
    ${LoginTypeEnum.LV}     | ${true}
  `(
    "should return LoginTypeEnum.LEGACY when loginType is $loginType, user is eligible for fast-login $isUserEligibleForFastLogin and lollipop is NOT enabled",
    async ({ loginType, isUserElegibleForFastLogin }) => {
      const result = getLoginType(loginType, isUserElegibleForFastLogin, false);

      expect(result).toEqual(LoginTypeEnum.LEGACY);
    }
  );
});
