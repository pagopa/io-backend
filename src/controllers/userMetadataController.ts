/**
 * This controller handles the user metadata stored in
 * redis database through the user metadata storage service.
 */

import * as express from "express";
import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorConflict,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import * as E from "fp-ts/lib/Either";
import { IResponseNoContent, ResponseNoContent } from "../utils/responses";

import { UserMetadata } from "../../generated/backend/UserMetadata";
import { IUserMetadataStorage } from "../services/IUserMetadataStorage";
import {
  invalidVersionNumberError,
  metadataNotFoundError
} from "../services/redisUserMetadataStorage";
import { withUserFromRequest } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";

export default class UserMetadataController {
  constructor(private readonly userMetadataStorage: IUserMetadataStorage) {}

  /**
   * Returns the metadata for the current authenticated user.
   */
  public readonly getMetadata = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseNoContent
    | IResponseSuccessJson<UserMetadata>
  > =>
    withUserFromRequest(req, async user => {
      const metadata = await this.userMetadataStorage.get(user);
      if (E.isLeft(metadata)) {
        return metadata.left === metadataNotFoundError
          ? ResponseNoContent()
          : ResponseErrorInternal(metadata.left.message);
      } else {
        return ResponseSuccessJson(metadata.right);
      }
    });

  /**
   * Create or update the metadata for the current authenticated user.
   *
   * This API dosen't support atomic operations on concurrency scenario.
   * Story https://www.pivotaltracker.com/story/show/167064659
   */
  public readonly upsertMetadata = (
    req: express.Request
  ): Promise<
    | IResponseErrorConflict
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseSuccessJson<UserMetadata>
  > =>
    withUserFromRequest(req, async user =>
      withValidatedOrValidationError(
        UserMetadata.decode(req.body),
        async metadata => {
          const setMetadataResponse = await this.userMetadataStorage.set(
            user,
            metadata
          );
          if (E.isLeft(setMetadataResponse)) {
            if (setMetadataResponse.left === invalidVersionNumberError) {
              return ResponseErrorConflict(setMetadataResponse.left.message);
            }
            return ResponseErrorInternal(setMetadataResponse.left.message);
          }
          return ResponseSuccessJson(metadata);
        }
      )
    );
}
