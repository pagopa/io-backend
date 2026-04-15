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
  IResponseSuccessRedirectToResource
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import { Otp } from "generated/cgn-card-platform/Otp";

import { Card } from "../../generated/cgn-card-platform/Card";
import { InstanceId } from "../../generated/cgn-card-platform/InstanceId";
import CgnService from "../../src/services/cgnService";
import { withUserFromRequest } from "../types/user";

export default class CgnController {
  constructor(private readonly cgnService: CgnService) {}

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
  > => withUserFromRequest(req, this.cgnService.getCgnStatus);

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
  > => withUserFromRequest(req, this.cgnService.getEycaStatus);

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
  > => withUserFromRequest(req, this.cgnService.startCgnActivation);

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
  > => withUserFromRequest(req, this.cgnService.getCgnActivation);

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
  > => withUserFromRequest(req, this.cgnService.getEycaActivation);

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
  > => withUserFromRequest(req, this.cgnService.startEycaActivation);

  /**
   * Start a Cgn unsubscription for the current user.
   */
  public readonly startCgnUnsubscription = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorConflict
    | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
    | IResponseSuccessAccepted
  > => withUserFromRequest(req, this.cgnService.startCgnUnsubscription);

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
  > => withUserFromRequest(req, this.cgnService.generateOtp);
}
