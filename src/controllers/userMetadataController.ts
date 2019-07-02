/**
 * This controller handles the user metadata stored in
 * redis database through the user metadata storage service.
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { UserMetadataResponse } from "../../generated/backend/UserMetadataResponse";

import { isLeft } from "fp-ts/lib/Either";
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
   * Returns the metadata for the user identified by the provided fiscal
   * code.
   */
  public readonly getMetadata = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseSuccessJson<UserMetadataResponse>
  > =>
    withUserFromRequest(req, async user => {
      const metadata = await this.userMetadataStorage.get(user);
      if (isLeft(metadata)) {
        return metadata.value === metadataNotFoundError
          ? ResponseSuccessJson({})
          : ResponseErrorInternal(metadata.value.message);
      } else {
        return ResponseSuccessJson(metadata.value);
      }
    });

  /**
   * Create or update the metadata for the user identified by the provided
   * fiscal code.
   */
  public readonly upsertMetadata = (
    req: express.Request
  ): Promise<
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
          if (isLeft(setMetadataResponse)) {
            if (setMetadataResponse.value === invalidVersionNumberError) {
              return ResponseErrorValidation(
                "Bad request",
                setMetadataResponse.value.message
              );
            }
            return ResponseErrorInternal(setMetadataResponse.value.message);
          }
          return ResponseSuccessJson(metadata);
        }
      )
    );
}
