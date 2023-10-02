import AuthenticationLockService from "../services/authenticationLockService";

import * as TE from "fp-ts/TaskEither";

// --------------------------------
// AuthenticationLockService Mock
// --------------------------------

export const isUserAuthenticationLockedMock = jest.fn(() =>
  TE.of<Error, boolean>(false)
);
export const lockUserAuthenticationMock = jest.fn(() =>
  TE.of<Error, boolean>(true)
);

export const AuthenticationLockServiceMock = {
  isUserAuthenticationLocked: isUserAuthenticationLockedMock,
  lockUserAuthentication: lockUserAuthenticationMock,
} as any as AuthenticationLockService;

// --------------------------------
// \ AuthenticationLockService Mock
// --------------------------------
