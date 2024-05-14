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
import { FeaturedServices } from "generated/services-app-backend/FeaturedServices";
import { Institutions } from "generated/services-app-backend/Institutions";
import { InstitutionServicesResource } from "generated/services-app-backend/InstitutionServicesResource";

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

  public readonly getFeaturedServices = async (
    _req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<FeaturedServices>
  > => this.servicesAppBackendService.getFeaturedServices();

  public readonly getFeaturedInstitutions = async (
    _req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<Institutions>
  > => this.servicesAppBackendService.getFeaturedInstitutions();

  public readonly findInstutionServices = async (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<InstitutionServicesResource>
  > =>
    withValidatedOrInternalError(
      // TODO: after fixing institutionId type update decoder type
      NonEmptyString.decode(req.params.institutionId),
      (institutionId) =>
        this.servicesAppBackendService.findInstutionServices(institutionId)
    );
}
