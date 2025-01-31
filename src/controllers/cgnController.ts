/**
 * This controller handles the CGN requests from the
 * app by forwarding the call to the API system.
 */

import { CgnActivationDetail } from "@pagopa/io-functions-cgn-sdk/CgnActivationDetail";
import { EycaActivationDetail } from "@pagopa/io-functions-cgn-sdk/EycaActivationDetail";
import { EycaCard } from "@pagopa/io-functions-cgn-sdk/EycaCard";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  IResponseSuccessRedirectToResource,
  ResponseErrorForbiddenNotAuthorized,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import { Otp } from "generated/cgn/Otp";

import { Card } from "../../generated/cgn/Card";
import { InstanceId } from "../../generated/cgn/InstanceId";
import CgnService from "../../src/services/cgnService";
import { User, withUserFromRequest } from "../types/user";

export const withAllowedUser = async <T>(
  user: User,
  allowedFiscalCodes: readonly FiscalCode[],
  f: (user: User) => Promise<T>,
) =>
  allowedFiscalCodes.length === 0 ||
  allowedFiscalCodes.includes(user.fiscal_code)
    ? f(user)
    : ResponseErrorForbiddenNotAuthorized;

export default class CgnController {
  /**
   * Generate a CGN OTP for the current user.
   */
  public readonly generateOtp = (
    req: express.Request,
  ): Promise<
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<Otp>
  > =>
    withUserFromRequest(req, (user) =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.generateOtp,
      ),
    );

  /**
   * Get Cgn activation's process status for the current user.
   */
  public readonly getCgnActivation = (
    req: express.Request,
  ): Promise<
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseSuccessJson<CgnActivationDetail>
  > =>
    withUserFromRequest(req, (user) =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.getCgnActivation,
      ),
    );

  /**
   * Get the Cgn status for the current user.
   */
  public readonly getCgnStatus = (
    req: express.Request,
  ): Promise<
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseSuccessJson<Card>
  > =>
    withUserFromRequest(req, (user) =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.getCgnStatus,
      ),
    );

  /**
   * Get EYCA card activation's process status for the current user.
   */
  public readonly getEycaActivation = (
    req: express.Request,
  ): Promise<
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseSuccessJson<EycaActivationDetail>
  > =>
    withUserFromRequest(req, (user) =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.getEycaActivation,
      ),
    );

  /**
   * Get the Eyca Card status for the current user.
   */
  public readonly getEycaStatus = (
    req: express.Request,
  ): Promise<
    | IResponseErrorConflict
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseSuccessJson<EycaCard>
  > =>
    withUserFromRequest(req, (user) =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.getEycaStatus,
      ),
    );

  /**
   * Start a Cgn activation for the current user.
   */
  public readonly startCgnActivation = (
    req: express.Request,
  ): Promise<
    | IResponseErrorConflict
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessAccepted
    | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
  > =>
    withUserFromRequest(req, (user) =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.startCgnActivation,
      ),
    );

  /**
   * Start a Cgn unsubscription for the current user.
   */
  public readonly startCgnUnsubscription = (
    req: express.Request,
  ): Promise<
    | IResponseErrorConflict
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessAccepted
    | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
  > =>
    withUserFromRequest(req, (user) =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.startCgnUnsubscription,
      ),
    );

  /**
   * Start an EYCA activation for the current user.
   */
  public readonly startEycaActivation = (
    req: express.Request,
  ): Promise<
    | IResponseErrorConflict
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessAccepted
    | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
  > =>
    withUserFromRequest(req, (user) =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.startEycaActivation,
      ),
    );

  constructor(
    private readonly cgnService: CgnService,
    private readonly allowedFiscalCodes: readonly FiscalCode[],
  ) {}
}
