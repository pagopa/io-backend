import {
  ApiHeaderJson,
  composeHeaderProducers,
  createFetchRequestForApi,
  ReplaceRequestParams,
  RequestHeaderProducer,
  RequestParams,
  TypeofApiCall
} from "italia-ts-commons/lib/requests";
import { Omit } from "italia-ts-commons/lib/types";
import nodeFetch from "node-fetch";

import {
  startBonusEligibilityCheckDefaultDecoder,
  StartBonusEligibilityCheckT
} from "../../generated/io-bonus-api/requestTypes";

// we want to authenticate against the platform APIs with
// the Azure Functions header key
function SubscriptionKeyHeaderProducer<P>(
  token: string
): RequestHeaderProducer<P, "Ocp-Apim-Subscription-Key"> {
  return () => ({
    "Ocp-Apim-Subscription-Key": token,
    "X-Functions-Key": token
  });
}

export function APIClient(
  baseUrl: string,
  token: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch // TODO: customize fetch with timeout
): {
  readonly startBonusEligibilityCheck: TypeofApiCall<
    typeof startBonusEligibilityCheckT
  >;
} {
  const options = {
    baseUrl,
    fetchApi
  };
  const tokenHeaderProducer = SubscriptionKeyHeaderProducer(token);

  const startBonusEligibilityCheckT: ReplaceRequestParams<
    StartBonusEligibilityCheckT,
    Omit<RequestParams<StartBonusEligibilityCheckT>, "SubscriptionKey">
  > = {
    body: _ => "",
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: startBonusEligibilityCheckDefaultDecoder(),
    url: params => `/profiles/${params.fiscalCode}`
  };

  return {
    startBonusEligibilityCheck: createFetchRequestForApi(
      startBonusEligibilityCheckT,
      options
    )
  };
}

export type APIClient = typeof APIClient;
