import AuthenticationLockService from "../services/authenticationLockService";

import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

// --------------------------------
// AuthenticationLockService Mock
// --------------------------------

export const isUserAuthenticationLockedMock = jest.fn(() =>
  TE.of<Error, boolean>(false)
);

export const lockUserAuthenticationMockLazy = jest.fn(async (_cf, _code) =>
  E.of<Error, boolean>(true)
);
export const lockUserAuthenticationMock = jest.fn(
  (cf, code) => () => lockUserAuthenticationMockLazy(cf, code)
);

export const AuthenticationLockServiceMock = {
  isUserAuthenticationLocked: isUserAuthenticationLockedMock,
  lockUserAuthentication: lockUserAuthenticationMock,
} as any as AuthenticationLockService;

// --------------------------------
// \ AuthenticationLockService Mock
// --------------------------------
