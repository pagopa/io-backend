/**
 * This controller handles the CGN requests from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  IResponseSuccessRedirectToResource,
  ResponseErrorForbiddenNotAuthorized
} from "italia-ts-commons/lib/responses";

import { EycaActivationDetail } from "generated/io-cgn-api/EycaActivationDetail";
import { EycaCard } from "generated/io-cgn-api/EycaCard";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { Otp } from "generated/cgn/Otp";
import { Card } from "../../generated/cgn/Card";
import CgnService from "../../src/services/cgnService";
import { InstanceId } from "../../generated/cgn/InstanceId";
import { User, withUserFromRequest } from "../types/user";
import { CgnActivationDetail } from "../../generated/io-cgn-api/CgnActivationDetail";

export const withAllowedUser = async <T>(
  user: User,
  allowedFiscalCodes: ReadonlyArray<FiscalCode>,
  f: (user: User) => Promise<T>
) =>
  allowedFiscalCodes.length === 0 ||
  allowedFiscalCodes.includes(user.fiscal_code)
    ? f(user)
    : ResponseErrorForbiddenNotAuthorized;

export default class CgnController {
  constructor(
    private readonly cgnService: CgnService,
    private readonly allowedFiscalCodes: ReadonlyArray<FiscalCode>
  ) {}

  /**
   * Get the Cgn status for the current user.
   */
  public readonly getCgnStatus = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<Card>
  > =>
    withUserFromRequest(req, user =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.getCgnStatus
      )
    );

  /**
   * Get the Eyca Card status for the current user.
   */
  public readonly getEycaStatus = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorConflict
    | IResponseSuccessJson<EycaCard>
  > =>
    withUserFromRequest(req, user =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.getEycaStatus
      )
    );

  /**
   * Start a Cgn activation for the current user.
   */
  public readonly startCgnActivation = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorConflict
    | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
    | IResponseSuccessAccepted
  > =>
    withUserFromRequest(req, user =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.startCgnActivation
      )
    );

  /**
   * Get Cgn activation's process status for the current user.
   */
  public readonly getCgnActivation = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<CgnActivationDetail>
  > =>
    withUserFromRequest(req, user =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.getCgnActivation
      )
    );

  /**
   * Get EYCA card activation's process status for the current user.
   */
  public readonly getEycaActivation = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<EycaActivationDetail>
  > =>
    withUserFromRequest(req, user =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.getEycaActivation
      )
    );

  /**
   * Start an EYCA activation for the current user.
   */
  public readonly startEycaActivation = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorConflict
    | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
    | IResponseSuccessAccepted
  > =>
    withUserFromRequest(req, user =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.startEycaActivation
      )
    );

  /**
   * Generate a CGN OTP for the current user.
   */
  public readonly generateOtp = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<Otp>
  > =>
    withUserFromRequest(req, user =>
      withAllowedUser(
        user,
        this.allowedFiscalCodes,
        this.cgnService.generateOtp
      )
    );
}
