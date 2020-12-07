/**
 * This controller handles requests made from the PagoPA backend.
 */

import * as express from "express";
import {
  fromEither,
  fromLeft,
  taskEither,
  tryCatch
} from "fp-ts/lib/TaskEither";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { EmailString } from "italia-ts-commons/lib/strings";
import { ISessionStorage } from "src/services/ISessionStorage";

import { EmailAddress } from "../../generated/io-api/EmailAddress";
import { PagoPAUser } from "../../generated/pagopa/PagoPAUser";
import ProfileService from "../services/profileService";
import { withUserFromRequest } from "../types/user";

const VALIDATION_ERROR_TITLE = "Validation Error";

export default class PagoPAController {
  constructor(
    readonly profileService: ProfileService,
    private readonly sessionStorage: ISessionStorage
  ) {}
  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   */
  public readonly getUser = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<PagoPAUser>
  > =>
    withUserFromRequest(req, async user => {
      const errorResponseOrNoticeEmail = await tryCatch(
        () => this.sessionStorage.getPagoPaNoticeEmail(user),
        _ => new Error("Error reading the notify email cache")
      )
        .foldTaskEither(_ => fromLeft<Error, EmailString>(_), fromEither)
        .foldTaskEither(
          _ =>
            tryCatch(
              () => this.profileService.getProfile(user),
              () => new Error("Error getting the profile")
            )
              .foldTaskEither(
                _1 =>
                  fromLeft<
                    | IResponseErrorInternal
                    | IResponseErrorTooManyRequests
                    | IResponseErrorNotFound,
                    EmailString | undefined
                  >(ResponseErrorInternal("Internal server error")),
                response => {
                  if (response.kind !== "IResponseSuccessJson") {
                    // if getProfile returns a failure, we just return it
                    return fromLeft(response);
                  }
                  // if no validated email is provided into InitializedProfile
                  // spid_email will be used for notice email
                  const maybeNoticeEmail: EmailAddress | undefined =
                    response.value.email && response.value.is_email_validated
                      ? response.value.email
                      : user.spid_email;
                  return taskEither.of(maybeNoticeEmail);
                }
              )
              .chain(maybeNoticeEmail => {
                if (!maybeNoticeEmail) {
                  return taskEither.of(maybeNoticeEmail);
                }
                return tryCatch(
                  () =>
                    this.sessionStorage.setPagoPaNoticeEmail(
                      user,
                      maybeNoticeEmail
                    ),
                  () => new Error("Error caching the notify email value")
                ).foldTaskEither(
                  _1 => taskEither.of(maybeNoticeEmail),
                  _1 => taskEither.of(maybeNoticeEmail)
                );
              }),
          _ => taskEither.of(_)
        )
        .run();

      if (errorResponseOrNoticeEmail.isLeft()) {
        return errorResponseOrNoticeEmail.value;
      }

      // If no valid notice_email is present a validation error is returned as response
      return PagoPAUser.decode({
        family_name: user.family_name,
        fiscal_code: user.fiscal_code,
        mobile_phone: user.spid_mobile_phone,
        name: user.name,
        notice_email: errorResponseOrNoticeEmail.value,
        spid_email: user.spid_email
      }).fold<IResponseSuccessJson<PagoPAUser> | IResponseErrorValidation>(
        _ =>
          ResponseErrorValidation(VALIDATION_ERROR_TITLE, "Invalid User Data"),
        ResponseSuccessJson
      );
    });
}
