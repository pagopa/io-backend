/**
 * Interface for the session storage services.
 */

import { Either } from "fp-ts/lib/Either";
import { UserMetadata } from "generated/backend/UserMetadata";
import { User } from "../types/user";

export interface IUserMetadataStorage {
  /**
   * Stores a User Metadata information from Redis Storage
   */
  readonly set: (
    user: User,
    payload: UserMetadata
  ) => Promise<Either<Error, boolean>>;

  /**
   * Retreive User Metadata information from Redis Storage
   */
  readonly get: (user: User) => Promise<Either<Error, UserMetadata>>;
}
