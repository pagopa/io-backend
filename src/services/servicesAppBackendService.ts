import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { InstitutionsResource } from "generated/services-app-backend/InstitutionsResource";
import { ScopeType } from "generated/services-app-backend/ScopeType";
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
}
