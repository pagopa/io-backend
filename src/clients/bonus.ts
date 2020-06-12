import {
  ApiHeaderJson,
  composeHeaderProducers,
  createFetchRequestForApi,
  IPostApiRequestType,
  IResponseType,
  ReplaceRequestParams,
  RequestHeaderProducer,
  RequestParams,
  TypeofApiCall
} from "italia-ts-commons/lib/requests";
import { Omit } from "italia-ts-commons/lib/types";
import nodeFetch from "node-fetch";

import { InstanceId } from "generated/io-bonus-api/InstanceId";
import { ProblemJson } from "italia-ts-commons/lib/responses";
import {
  getAllBonusActivationsDefaultDecoder,
  GetAllBonusActivationsT,
  getBonusEligibilityCheckDefaultDecoder,
  GetBonusEligibilityCheckT,
  getLatestBonusActivationByIdDefaultDecoder,
  GetLatestBonusActivationByIdT,
  startBonusActivationProcedureDefaultDecoder,
  startBonusEligibilityCheckDefaultDecoder
} from "../../generated/io-bonus-api/requestTypes";

// we want to authenticate against the platform APIs with
// the Azure Functions header key
function SubscriptionKeyHeaderProducer<P>(
  token: string
  // tslint:disable-next-line: no-duplicate-string (WHY THE LINT INTERPRETS THIS AS A VALUE AND NOT AS A TYPE?)
): RequestHeaderProducer<P, "X-Functions-Key"> {
  return () => ({
    "X-Functions-Key": token
  });
}

export function BonusAPIClient(
  token: string,
  baseUrl: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): {
  readonly getAllBonusActivations: TypeofApiCall<
    typeof getAllBonusActivationsT
  >;
  readonly getBonusEligibilityCheck: TypeofApiCall<
    typeof getBonusEligibilityCheckT
  >;
  readonly getLatestBonusActivationById: TypeofApiCall<
    typeof getLatestBonusActivationByIdT
  >;
  readonly startBonusActivationProcedure: TypeofApiCall<
    typeof startBonusActivationProcedureT
  >;
  readonly startBonusEligibilityCheck: TypeofApiCall<
    typeof startBonusEligibilityCheckT
  >;
} {
  const options = {
    baseUrl,
    fetchApi
  };
  const tokenHeaderProducer = SubscriptionKeyHeaderProducer(token);

  // This request type need to be rewritten because the code generator doesn't handle custom response header values
  const startBonusEligibilityCheckT: IPostApiRequestType<
    { readonly fiscalCode: string },
    "Content-Type" | "X-Functions-Key",
    never,
    // tslint:disable-next-line: max-union-size
    | IResponseType<201, InstanceId, "Location">
    | IResponseType<202, undefined>
    | IResponseType<401, undefined>
    | IResponseType<403, undefined>
    | IResponseType<409, ProblemJson>
    | IResponseType<500, ProblemJson>
  > = {
    body: _ => "",
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: startBonusEligibilityCheckDefaultDecoder(),
    url: params => `/bonus/vacanze/eligibility/${params.fiscalCode}`
  };

  const getBonusEligibilityCheckT: ReplaceRequestParams<
    GetBonusEligibilityCheckT,
    Omit<RequestParams<GetBonusEligibilityCheckT>, "ApiKey">
  > = {
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "get",
    query: _ => ({}),
    response_decoder: getBonusEligibilityCheckDefaultDecoder(),
    url: params => `/bonus/vacanze/eligibility/${params.fiscalCode}`
  };

  const getLatestBonusActivationByIdT: ReplaceRequestParams<
    GetLatestBonusActivationByIdT,
    Omit<RequestParams<GetLatestBonusActivationByIdT>, "ApiKey">
  > = {
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "get",
    query: _ => ({}),
    response_decoder: getLatestBonusActivationByIdDefaultDecoder(),
    url: params =>
      `/bonus/vacanze/activations/${params.fiscalCode}/${params.bonus_id}`
  };

  const getAllBonusActivationsT: ReplaceRequestParams<
    GetAllBonusActivationsT,
    Omit<RequestParams<GetAllBonusActivationsT>, "ApiKey">
  > = {
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "get",
    query: _ => ({}),
    response_decoder: getAllBonusActivationsDefaultDecoder(),
    url: params => `/bonus/vacanze/activations/${params.fiscalCode}`
  };

  // This request type need to be rewritten because the code generator doesn't handle custom response header values
  const startBonusActivationProcedureT: IPostApiRequestType<
    { readonly fiscalCode: string },
    "Content-Type" | "X-Functions-Key",
    never,
    // tslint:disable-next-line: max-union-size
    | IResponseType<201, InstanceId, "Location">
    | IResponseType<202, undefined>
    | IResponseType<401, undefined>
    | IResponseType<403, undefined>
    | IResponseType<409, undefined>
    | IResponseType<410, undefined>
    | IResponseType<500, ProblemJson>
  > = {
    body: _ => "",
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: startBonusActivationProcedureDefaultDecoder(),
    url: params => `/bonus/vacanze/activations/${params.fiscalCode}`
  };

  return {
    getAllBonusActivations: createFetchRequestForApi(
      getAllBonusActivationsT,
      options
    ),
    getBonusEligibilityCheck: createFetchRequestForApi(
      getBonusEligibilityCheckT,
      options
    ),
    getLatestBonusActivationById: createFetchRequestForApi(
      getLatestBonusActivationByIdT,
      options
    ),
    startBonusActivationProcedure: createFetchRequestForApi(
      startBonusActivationProcedureT,
      options
    ),
    startBonusEligibilityCheck: createFetchRequestForApi(
      startBonusEligibilityCheckT,
      options
    )
  };
}

export type BonusAPIClient = typeof BonusAPIClient;
