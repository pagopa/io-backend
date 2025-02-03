import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { FeaturedServices } from "../../generated/services-app-backend/FeaturedServices";
import { Institutions } from "../../generated/services-app-backend/Institutions";
import { InstitutionServicesResource } from "../../generated/services-app-backend/InstitutionServicesResource";
import { InstitutionsResource } from "../../generated/services-app-backend/InstitutionsResource";
import { ScopeType } from "../../generated/services-app-backend/ScopeType";
import { ServiceDetails } from "../../generated/services-app-backend/ServiceDetails";
import ServicesAppBackendService from "../services/servicesAppBackendService";
import {
  withValidatedOrInternalError,
  withValidatedOrValidationError,
} from "../utils/responses";

const parseOptionalStringParam = (stringParam?: unknown) =>
  stringParam ? String(stringParam) : undefined;

const parseOptionalNumberParam = (numberParam?: unknown) =>
  numberParam ? Number(numberParam) : undefined;

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
    withValidatedOrValidationError(
      pipe(
        req.query.scope,
        O.fromNullable,
        O.foldW(
          () => E.right(undefined),
          (scope) => ScopeType.decode(scope)
        )
      ),
      (scope) =>
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
    | IResponseErrorNotFound
    | IResponseSuccessJson<ServiceDetails>
  > =>
    withValidatedOrInternalError(
      NonEmptyString.decode(req.params.serviceId),
      (serviceId) => this.servicesAppBackendService.getServiceById(serviceId)
    );

  public readonly getFeaturedServices = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _req: express.Request
  ): Promise<IResponseErrorInternal | IResponseSuccessJson<FeaturedServices>> =>
    this.servicesAppBackendService.getFeaturedServices();

  public readonly getFeaturedInstitutions = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _req: express.Request
  ): Promise<IResponseErrorInternal | IResponseSuccessJson<Institutions>> =>
    this.servicesAppBackendService.getFeaturedInstitutions();

  public readonly findInstutionServices = async (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<InstitutionServicesResource>
  > =>
    withValidatedOrInternalError(
      NonEmptyString.decode(req.params.institutionId),
      (institutionId) =>
        this.servicesAppBackendService.findInstutionServices(
          institutionId,
          parseOptionalNumberParam(req.query.limit),
          parseOptionalNumberParam(req.query.offset)
        )
    );
}
