/**
 * This controller handles requests made from the PagoPA backend.
 */

import * as express from "express";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { ISessionStorage } from "src/services/ISessionStorage";
import { pipe } from "fp-ts/lib/function";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import { EmailAddress } from "@pagopa/io-functions-app-sdk/EmailAddress";
import { PagoPAUser } from "../../generated/pagopa/PagoPAUser";
import ProfileService from "../services/profileService";
import { withUserFromRequest } from "../types/user";

const VALIDATION_ERROR_TITLE = "Validation Error";
export default class PagoPAController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly sessionStorage: ISessionStorage,
    private readonly enableNoticeEmailCache: boolean
  ) {}

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   */
  public readonly getUser = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<PagoPAUser>
  > =>
    withUserFromRequest(req, async user => {
      const getProfileAndSaveNoticeEmailCache = pipe(
        TE.tryCatch(
          () => this.profileService.getProfile(user),
          () => new Error("Error getting the profile")
        ),
        TE.mapLeft(_ => ResponseErrorInternal("Internal server error")),
        TE.chain(response => {
          if (response.kind !== "IResponseSuccessJson") {
            return TE.left(response);
          }
          // if no validated email is provided into InitializedProfile
          // spid_email will be used for notice email
          const maybeNoticeEmail: EmailAddress | undefined =
            response.value.email && response.value.is_email_validated
              ? response.value.email
              : user.spid_email;
          return TE.of(O.fromNullable(maybeNoticeEmail));
        }),
        TE.chain(maybeNoticeEmail => {
          if (O.isNone(maybeNoticeEmail)) {
            return TE.of(maybeNoticeEmail as O.Option<EmailString>);
          }
          return pipe(
            TE.tryCatch(
              () =>
                this.sessionStorage.setPagoPaNoticeEmail(
                  user,
                  maybeNoticeEmail.value
                ),
              () => new Error("Error caching the notify email value")
            ),
            TE.orElseW(_1 => TE.of(maybeNoticeEmail)),
            TE.chain(_1 => TE.of(maybeNoticeEmail))
          );
        })
      );

      const errorResponseOrNoticeEmail = await (this.enableNoticeEmailCache
        ? pipe(
            TE.tryCatch(
              () => this.sessionStorage.getPagoPaNoticeEmail(user),
              _ => new Error("Error reading the notify email cache")
            ),
            TE.chain(TE.fromEither),
            TE.map(O.some),
            TE.orElse(_ => getProfileAndSaveNoticeEmailCache)
          )
        : getProfileAndSaveNoticeEmailCache)();

      if (E.isLeft(errorResponseOrNoticeEmail)) {
        return errorResponseOrNoticeEmail.left;
      }

      // If no valid notice_email is present a validation error is returned as response
      return pipe(
        {
          family_name: user.family_name,
          fiscal_code: user.fiscal_code,
          name: user.name,
          notice_email: O.toUndefined(errorResponseOrNoticeEmail.right),
          spid_email: user.spid_email
        },
        PagoPAUser.decode,
        E.mapLeft(_ =>
          ResponseErrorValidation(VALIDATION_ERROR_TITLE, "Invalid User Data")
        ),
        E.map(ResponseSuccessJson),
        E.toUnion
      );
    });
}
