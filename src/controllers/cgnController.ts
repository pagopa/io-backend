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
  IResponseSuccessRedirectToResource
} from "italia-ts-commons/lib/responses";

import { EycaActivationDetail } from "generated/io-cgn-api/EycaActivationDetail";
import { EycaCard } from "generated/io-cgn-api/EycaCard";
import { Card } from "../../generated/cgn/Card";
import CgnService from "../../src/services/cgnService";
import { InstanceId } from "../../generated/cgn/InstanceId";
import { withUserFromRequest } from "../types/user";
import { CgnActivationDetail } from "../../generated/io-cgn-api/CgnActivationDetail";

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
  > => withUserFromRequest(req, user => this.cgnService.getCgnStatus(user));

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
  > => withUserFromRequest(req, user => this.cgnService.getEycaStatus(user));

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
    withUserFromRequest(req, user => this.cgnService.startCgnActivation(user));

  /**
   * Get Cgn activation's process status for the current user.
   */
  public readonly getCgnActivation = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<CgnActivationDetail>
  > => withUserFromRequest(req, user => this.cgnService.getCgnActivation(user));

  /**
   * Get EYCA card activation's process status for the current user.
   */
  public readonly getEycaActivation = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<EycaActivationDetail>
  > =>
    withUserFromRequest(req, user => this.cgnService.getEycaActivation(user));

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
    withUserFromRequest(req, user => this.cgnService.startEycaActivation(user));
}
