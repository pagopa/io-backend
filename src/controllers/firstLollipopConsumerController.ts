import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import { flow, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { FirstLollipopConsumerClient } from "../clients/firstLollipopConsumer";
import { ResLocals } from "../utils/express";
import { withLollipopLocals, withRequiredRawBody } from "../types/lollipop";
import { SignMessageResponse } from "../../generated/lollipop-first-consumer/SignMessageResponse";

export const firstLollipopSign = (
  client: ReturnType<FirstLollipopConsumerClient>
) => async <T extends ResLocals>(
  _: express.Request,
  locals?: T
): Promise<
  | IResponseErrorValidation
  | IResponseErrorInternal
  | IResponseSuccessJson<SignMessageResponse>
> =>
  pipe(
    locals,
    withLollipopLocals,
    E.chain(withRequiredRawBody),
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
      E.mapLeft(
        flow(readableReportSimplified, message =>
          ResponseErrorInternal(
            `Unexpected Lollipop consumer response: ${message}`
          )
        )
      )
    ),
    TE.chain(response =>
      response.status === 200
        ? TE.right(response.value)
        : TE.left(
            ResponseErrorInternal(
              `signMessage returned ${response.status}: ${response.value?.title},${response.value?.detail}`
            )
          )
    ),
    TE.map(lcResponse => ResponseSuccessJson(lcResponse)),
    TE.toUnion
  )();
