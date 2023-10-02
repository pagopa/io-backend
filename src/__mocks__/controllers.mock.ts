import AuthenticationLockService from "../services/authenticationLockService";

import * as TE from "fp-ts/TaskEither";

// --------------------------------
// AuthenticationLockService Mock
// --------------------------------

export const isUserAuthenticationLockedMock = jest.fn(() => TE.of(false));

export const AuthenticationLockServiceMock = {
  isUserAuthenticationLocked: isUserAuthenticationLockedMock,
} as any as AuthenticationLockService;

// --------------------------------
// \ AuthenticationLockService Mock
// --------------------------------
