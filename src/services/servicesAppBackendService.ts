import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";

import { FeaturedServices } from "../../generated/services-app-backend/FeaturedServices";
import { InstitutionServicesResource } from "../../generated/services-app-backend/InstitutionServicesResource";
import { Institutions } from "../../generated/services-app-backend/Institutions";
import { InstitutionsResource } from "../../generated/services-app-backend/InstitutionsResource";
import { ScopeType } from "../../generated/services-app-backend/ScopeType";
import { ServiceDetails } from "../../generated/services-app-backend/ServiceDetails";
import { ServicesAppBackendAPIClient } from "../clients/services-app-backend";
import {
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError,
} from "../utils/responses";

// TODO: Aggiungere le altre operazioni del service
export default class ServicesAppBackendService {
  public readonly findInstitutions = (
    search?: string,
    scope?: ScopeType,
    limit?: number,
    offset?: number,
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<InstitutionsResource>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.findInstitutions({
        limit,
        offset,
        scope,
        search,
      });

      return withValidatedOrInternalError(validated, (response) =>
        response.status === 200
          ? withValidatedOrInternalError(
              InstitutionsResource.decode(response.value),
              ResponseSuccessJson,
            )
          : unhandledResponseStatus(response.status),
      );
    });

  public readonly findInstutionServices = (
    // TODO: fix institutionId type
    institutionId: string,
    limit?: number,
    offset?: number,
  ): Promise<
    IResponseErrorInternal | IResponseSuccessJson<InstitutionServicesResource>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.findInstutionServices({
        institutionId,
        limit,
        offset,
      });

      // TODO: sistemare i vari return
      return withValidatedOrInternalError(validated, (response) =>
        response.status === 200
          ? withValidatedOrInternalError(
              InstitutionServicesResource.decode(response.value),
              ResponseSuccessJson,
            )
          : unhandledResponseStatus(response.status),
      );
    });

  public readonly getFeaturedInstitutions = (): Promise<
    IResponseErrorInternal | IResponseSuccessJson<Institutions>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.getFeaturedInstitutions({});

      // TODO: sistemare i vari return
      return withValidatedOrInternalError(validated, (response) =>
        response.status === 200
          ? withValidatedOrInternalError(
              Institutions.decode(response.value),
              ResponseSuccessJson,
            )
          : unhandledResponseStatus(response.status),
      );
    });

  public readonly getFeaturedServices = (): Promise<
    IResponseErrorInternal | IResponseSuccessJson<FeaturedServices>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.getFeaturedServices({});

      // TODO: sistemare i vari return
      return withValidatedOrInternalError(validated, (response) =>
        response.status === 200
          ? withValidatedOrInternalError(
              FeaturedServices.decode(response.value),
              ResponseSuccessJson,
            )
          : unhandledResponseStatus(response.status),
      );
    });

  public readonly getServiceById = (
    serviceId: string,
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<ServiceDetails>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.getServiceById({
        serviceId,
      });

      return withValidatedOrInternalError(validated, (response) =>
        response.status === 200
          ? withValidatedOrInternalError(
              ServiceDetails.decode(response.value),
              ResponseSuccessJson,
            )
          : response.status === 404
            ? ResponseErrorNotFound("Not found", "Service not found")
            : unhandledResponseStatus(response.status),
      );
    });

  constructor(
    private readonly apiClient: ReturnType<ServicesAppBackendAPIClient>,
  ) {}
}
