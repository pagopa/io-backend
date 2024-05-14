import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { FeaturedServices } from "generated/services-app-backend/FeaturedServices";
import { InstitutionsResource } from "generated/services-app-backend/InstitutionsResource";
import { ScopeType } from "generated/services-app-backend/ScopeType";
import { ServiceDetails } from "generated/services-app-backend/ServiceDetails";
import { ServicesAppBackendAPIClient } from "src/clients/services-app-backend";
import {
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError,
} from "src/utils/responses";

// TODO: Aggiungere le altre operazioni del service
export default class ServicesAppBackendService {
  constructor(
    private readonly apiClient: ReturnType<ServicesAppBackendAPIClient>
  ) {}

  public readonly findInstitutions = (
    search?: string,
    scope?: ScopeType,
    limit?: number,
    offset?: number
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

      // TODO: sistemare i vari return
      return withValidatedOrInternalError(validated, (response) =>
        response.status === 200
          ? withValidatedOrInternalError(
              InstitutionsResource.decode(response.value),
              ResponseSuccessJson
            )
          : unhandledResponseStatus(response.status)
      );
    });

  public readonly getServiceById = (
    serviceId: string
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<ServiceDetails>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.getServiceById({
        serviceId,
      });

      // TODO: sistemare i vari return
      return withValidatedOrInternalError(validated, (response) =>
        response.status === 200
          ? withValidatedOrInternalError(
              ServiceDetails.decode(response.value),
              ResponseSuccessJson
            )
          : response.status === 404
          ? ResponseErrorNotFound("Not found", "Service not found")
          : unhandledResponseStatus(response.status)
      );
    });

  public readonly getFeaturedServices = (): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<FeaturedServices>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.getFeaturedServices({});

      // TODO: sistemare i vari return
      return withValidatedOrInternalError(validated, (response) =>
        response.status === 200
          ? withValidatedOrInternalError(
              FeaturedServices.decode(response.value),
              ResponseSuccessJson
            )
          : unhandledResponseStatus(response.status)
      );
    });
}
