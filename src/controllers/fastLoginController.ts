import { getFastLoginLollipopConsumerClient } from "src/clients/fastLoginLollipopConsumerClient";
import type * as express from "express";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

const FastLoginResponse = t.type({
  token: NonEmptyString,
});

type FastLoginResponse = t.TypeOf<typeof FastLoginResponse>;

export const fastLoginEndpoint =
  (client: ReturnType<getFastLoginLollipopConsumerClient>) =>
  async (
    req: express.Request
  ): Promise<
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseSuccessJson<FastLoginResponse>
  > => {
    //dummy instructions
    client.info("");
    req.header("dummy");
    return Promise.resolve(
      ResponseSuccessJson({ token: "dummy" } as FastLoginResponse)
    );
  };
