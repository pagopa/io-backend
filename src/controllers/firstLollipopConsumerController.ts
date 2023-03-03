import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import { FirstLollipopConsumerClient } from "src/clients/firstLollipopConsumer";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { LollipopLocals, withRequiredRawBody } from "../types/lollipop";
import { SignMessageResponse } from "../../generated/lollipop-first-consumer/SignMessageResponse";

export const firstLollipopSign = (
  client: ReturnType<FirstLollipopConsumerClient>
) => async (
  _: express.Request,
  locals?: LollipopLocals
): Promise<
  | IResponseErrorValidation
  | IResponseErrorInternal
  | IResponseSuccessJson<SignMessageResponse>
> =>
  pipe(
    locals,
    withRequiredRawBody,
    TE.fromEither,
    TE.chainW(localsWithBody =>
      TE.tryCatch(
        () =>
          client.signMessage({
            ...localsWithBody
          }),
        () => ResponseErrorInternal("Error calling the Lollipop Consumer")
      )
    ),
    TE.chainEitherKW(
      E.mapLeft(() =>
        ResponseErrorInternal("Unexpeded Lollipop consumer response")
      )
    ),
    TE.map(lcResponse => ResponseSuccessJson(lcResponse.value)),
    TE.toUnion
  )();
