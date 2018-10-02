import {
  IResponseType,
  TypeofApiParams,
  TypeofApiResponse
} from "italia-ts-commons/lib/requests";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ProblemJson
} from "italia-ts-commons/lib/responses";

export type AsControllerResponseType<T> = T extends IResponseType<200, infer R>
  ? IResponseSuccessJson<R>
  : T extends IResponseType<400, ProblemJson>
    ? IResponseErrorValidation
    : T extends IResponseType<404, ProblemJson>
      ? IResponseErrorNotFound
      : T extends IResponseType<500, ProblemJson>
        ? IResponseErrorInternal
        : never;

export type AsControllerFunction<T> = (
  params: TypeofApiParams<T>
) => Promise<AsControllerResponseType<TypeofApiResponse<T>>>;
