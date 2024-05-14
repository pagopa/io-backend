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
    | IResponseErrorNotFound
    | IResponseSuccessJson<InstitutionsResource>
  > =>
    withValidatedOrInternalError(ScopeType.decode(req.params.scope), (scope) =>
      this.servicesAppBackendService.findInstitutions(
        parseOptionalStringParam(req.query.search),
        scope,
        parseOptionalNumberParam(req.query.limit),
        parseOptionalNumberParam(req.query.offset)
      )
    );
}
