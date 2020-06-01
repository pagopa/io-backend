import {
  ApiHeaderJson,
  composeHeaderProducers,
  composeResponseDecoders,
  constantResponseDecoder,
  createFetchRequestForApi,
  ioResponseDecoder,
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
import { EligibilityCheck } from "../../generated/io-bonus-api/EligibilityCheck";
import {
  GetBonusEligibilityCheckT,
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
  baseUrl: string,
  token: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): {
  readonly getBonusEligibilityCheck: TypeofApiCall<
    typeof getBonusEligibilityCheckT
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

  // Custom decoder until we fix the problem in the io-utils generator
  // https://www.pivotaltracker.com/story/show/169915207
  // tslint:disable-next-line:typedef
  function getBonusEligibilityCheckCustomDecoder() {
    return composeResponseDecoders(
      composeResponseDecoders(
        composeResponseDecoders(
          composeResponseDecoders(
            constantResponseDecoder<undefined, 202>(202, undefined),
            ioResponseDecoder<
              200,
              typeof EligibilityCheck["_A"],
              typeof EligibilityCheck["_O"]
            >(200, EligibilityCheck)
          ),
          constantResponseDecoder<undefined, 401>(401, undefined)
        ),
        constantResponseDecoder<undefined, 404>(404, undefined)
      ),
      ioResponseDecoder<
        500,
        typeof ProblemJson["_A"],
        typeof ProblemJson["_O"]
      >(500, ProblemJson)
    );
  }

  const getBonusEligibilityCheckT: ReplaceRequestParams<
    GetBonusEligibilityCheckT,
    Omit<RequestParams<GetBonusEligibilityCheckT>, "ApiKey">
  > = {
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "get",
    query: _ => ({}),
    response_decoder: getBonusEligibilityCheckCustomDecoder(),
    url: params => `/bonus/vacanze/eligibility/${params.fiscalCode}`
  };

  return {
    getBonusEligibilityCheck: createFetchRequestForApi(
      getBonusEligibilityCheckT,
      options
    ),
    startBonusEligibilityCheck: createFetchRequestForApi(
      startBonusEligibilityCheckT,
      options
    )
  };
}

export type BonusAPIClient = typeof BonusAPIClient;
