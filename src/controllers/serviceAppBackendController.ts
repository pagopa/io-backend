import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { InstitutionsResource } from "generated/services-app-backend/InstitutionsResource";
import { ScopeType } from "generated/services-app-backend/ScopeType";
import ServicesAppBackendService from "src/services/servicesAppBackendService";
import { withValidatedOrInternalError } from "src/utils/responses";
import express = require("express");
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { ServiceDetails } from "generated/services-app-backend/ServiceDetails";

const parseOptionalStringParam = (stringParam?: unknown) =>
  stringParam ? String(stringParam) : undefined;

const parseOptionalNumberParam = (numberParam?: unknown) =>
  numberParam ? Number(numberParam) : undefined;

// TODO: Aggiungere le altre operazioni del controller
export default class ServicesAppBackendController {
  constructor(
    private readonly servicesAppBackendService: ServicesAppBackendService
  ) {}

  public readonly findInstitutions = async (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<InstitutionsResource>
  > =>
    withValidatedOrInternalError(ScopeType.decode(req.query.scope), (scope) =>
      this.servicesAppBackendService.findInstitutions(
        parseOptionalStringParam(req.query.search),
        scope,
        parseOptionalNumberParam(req.query.limit),
        parseOptionalNumberParam(req.query.offset)
      )
    );

  public readonly getServiceById = async (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<ServiceDetails>
  > =>
    withValidatedOrInternalError(
      NonEmptyString.decode(req.params.serviceId),
      (serviceId) => this.servicesAppBackendService.getServiceById(serviceId)
    );
}
