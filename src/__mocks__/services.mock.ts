import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

import AuthenticationLockService, {
  NotReleasedAuthenticationLockData,
} from "../services/authenticationLockService";

// --------------------------------
// AuthenticationLockService Data
// --------------------------------

export { aNotReleasedData, anUnlockCode } from "./lockedProfileTableClient";

// --------------------------------
// AuthenticationLockService Mock
// --------------------------------

export const isUserAuthenticationLockedMock = jest.fn(() =>
  TE.of<Error, boolean>(false)
);

export const getUserAuthenticationLockDataMock = jest.fn(() =>
  TE.of<Error, ReadonlyArray<NotReleasedAuthenticationLockData>>([])
);

export const lockUserAuthenticationMockLazy = jest.fn(async (_cf, _code) =>
  E.of<Error, boolean>(true)
);
export const lockUserAuthenticationMock = jest.fn(
  (cf, code) => () => lockUserAuthenticationMockLazy(cf, code)
);
export const unlockUserAuthenticationMock = jest.fn(
  (_cf, _codes) => () => E.of<Error, boolean>(true)
);

export const AuthenticationLockServiceMock = {
  isUserAuthenticationLocked: isUserAuthenticationLockedMock,
  getUserAuthenticationLockData: getUserAuthenticationLockDataMock,
  lockUserAuthentication: lockUserAuthenticationMock,
  unlockUserAuthentication: unlockUserAuthenticationMock,
} as any as AuthenticationLockService;

// --------------------------------
// \ AuthenticationLockService Mock
// --------------------------------
