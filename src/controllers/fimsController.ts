/**
 * This controller handles the FIMS requests from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import * as TE from "fp-ts/TaskEither";
import * as t from "io-ts";

import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";

import { pipe } from "fp-ts/lib/function";
import { EmailString, FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { AccessHistoryPage } from "generated/io-fims/AccessHistoryPage";
import { ExportRequest } from "generated/io-fims/ExportRequest";

import IoFimsService from "../services/fimsService";

import { withUserFromRequest } from "../types/user";
import ProfileService from "../services/profileService";

import { profileWithEmailValidatedOrError } from "../utils/profile";

const responseErrorInternal = (reason: string) => (e: Error) =>
  ResponseErrorInternal(`${reason} | ${e.message}`);

/**
 * Retrieves the access history for a given fiscal code.
 *
 * @param ioFimsService - The service used to fetch the access history.
 * @param fiscalCode - The fiscal code for which the access history is requested.
 * @param page - (Optional) The page number for paginated results.
 * @returns A TaskEither containing either an error or the access history.
 */
const getAccessHistory = (
  ioFimsService: IoFimsService,
  fiscalCode: FiscalCode,
  page?: string
) =>
  pipe(
    TE.tryCatch(
      () => ioFimsService.getAccessHistory(fiscalCode, page),
      () => new Error("Error while fetching the access history")
    ),
    TE.mapLeft(responseErrorInternal("Fetching error"))
  );

/**
 * Requests an export of data for a given fiscal code and email using the provided IoFimsService.
 *
 * @param ioFimsService - The service used to request the export.
 * @param fiscalCode - The fiscal code of the user for whom the export is requested.
 * @param email - The email address to which the export will be sent.
 * @returns A TaskEither that resolves to an error or the result of the export request.
 */
const requestExport = (
  ioFimsService: IoFimsService,
  fiscalCode: FiscalCode,
  email: EmailString
) =>
  pipe(
    TE.tryCatch(
      () => ioFimsService.requestExport(fiscalCode, email),
      () => new Error("Error while requesting the export")
    ),
    TE.mapLeft(responseErrorInternal("Error while requesting the export"))
  );

export default class IoFimsController {
  /**
   * Constructs an instance of IoFimsController.
   *
   * @param ioFimsService - The service responsible for FIMS operations.
   * @param profileService - The service responsible for profile operations.
   */
  constructor(
    private readonly ioFimsService: IoFimsService,
    private readonly profileService: ProfileService
  ) {}

  /**
   * Retrieves the access history for a user.
   *
   * @param req - The express request object containing the user's request.
   * @returns A promise that resolves to one of the following:
   * - `IResponseErrorValidation` if there is a validation error.
   * - `IResponseErrorInternal` if there is an internal server error.
   * - `IResponseSuccessJson<AccessHistoryPage>` if the access history is successfully retrieved.
   */
  public readonly getAccessHistory = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseSuccessJson<AccessHistoryPage>
  > =>
    withUserFromRequest(req, async (user) =>
      pipe(
        t.union([t.undefined, t.string]).decode(req.query.page),
        TE.fromEither,
        TE.altW(() => TE.right(undefined)),
        TE.flatMap((page) =>
          getAccessHistory(this.ioFimsService, user.fiscal_code, page)
        ),
        TE.toUnion
      )()
    );

  /**
   * Handles the export request by validating the user's email and then
   * initiating the export process.
   *
   * @param req - The express request object.
   * @returns A promise that resolves to one of the following:
   * - `IResponseErrorValidation` if there is a validation error.
   * - `IResponseErrorConflict` if there is a conflict error.
   * - `IResponseErrorInternal` if there is an internal server error.
   * - `IResponseSuccessAccepted<ExportRequest>` if the export request is accepted.
   */
  public readonly requestExport = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorConflict
    | IResponseErrorInternal
    | IResponseSuccessAccepted<ExportRequest>
  > =>
    withUserFromRequest(req, async (user) =>
      pipe(
        profileWithEmailValidatedOrError(this.profileService, user),
        TE.mapLeft(
          responseErrorInternal(
            "Error retrieving a user profile with validated email address"
          )
        ),
        TE.flatMap((profile) =>
          requestExport(this.ioFimsService, profile.fiscal_code, profile.email)
        ),
        TE.toUnion
      )()
    );
}
