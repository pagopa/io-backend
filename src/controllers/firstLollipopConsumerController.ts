import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pick } from "@pagopa/ts-commons/lib/types";
import * as express from "express";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { SignMessageResponse } from "../../generated/auth/SignMessageResponse";
import { FirstLollipopConsumerClient } from "../clients/firstLollipopConsumer";
import { withLollipopLocals, withRequiredRawBody } from "../types/lollipop";
import { logLollipopSignRequest } from "../utils/appinsights";
import { ResLocals } from "../utils/express";

const FIRST_LOLLIPOP_CONSUMER_ID = "fist-lollipop-consumer" as NonEmptyString;

export const firstLollipopSign =
  (client: ReturnType<FirstLollipopConsumerClient>) =>
  async <T extends ResLocals>(
    req: express.Request,
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
      TE.chainW((localsWithBody) =>
        pipe(
          TE.tryCatch(
            () =>
              client.signMessage({
                ...localsWithBody
              }),
            () => ResponseErrorInternal("Error calling the Lollipop Consumer")
          ),
          TE.chainFirstW(
            flow(
              E.map((res) => pick(["status"], res)),
              E.mapLeft(
                flow(readableReportSimplified, (message) => new Error(message))
              ),
              logLollipopSignRequest(FIRST_LOLLIPOP_CONSUMER_ID)(
                localsWithBody,
                req
              ),
              TE.of
            )
          )
        )
      ),
      TE.chainEitherKW(
        E.mapLeft(
          flow(readableReportSimplified, (message) =>
            ResponseErrorInternal(
              `Unexpected Lollipop consumer response: ${message}`
            )
          )
        )
      ),
      TE.chain((response) =>
        response.status === 200
          ? TE.right(response.value)
          : TE.left(
              ResponseErrorInternal(
                `signMessage returned ${response.status}: ${response.value?.title},${response.value?.detail}`
              )
            )
      ),
      TE.map((lcResponse) => ResponseSuccessJson(lcResponse)),
      TE.toUnion
    )();
