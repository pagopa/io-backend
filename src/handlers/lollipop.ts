import {
  DEFAULT_LOLLIPOP_HASH_ALGORITHM,
  LollipopHashAlgorithm,
  LOLLIPOP_PUB_KEY_HASHING_ALGO_HEADER_NAME,
  LOLLIPOP_PUB_KEY_HEADER_NAME,
} from "@pagopa/io-spid-commons/dist/types/lollipop";
import { JwkPublicKeyFromToken } from "@pagopa/ts-commons/lib/jwk";
import * as express from "express";
import * as appInsights from "applicationinsights";
import { constUndefined, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Apply";
import * as B from "fp-ts/lib/boolean";
import * as TE from "fp-ts/lib/TaskEither";
import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorValidation,
  ResponseErrorConflict,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import { LollipopApiClient } from "src/clients/lollipop";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { JwkPubKeyHashAlgorithmEnum } from "../../generated/lollipop-api/JwkPubKeyHashAlgorithm";
import { NewPubKey } from "../../generated/lollipop-api/NewPubKey";
import { withValidatedOrValidationError } from "../utils/responses";
import { errorsToError } from "../utils/errorsFormatter";

const getLoginErrorEventName = "lollipop.error.get-login";

/**
 * 1. Read pubkey header
 * 2. Decode key
 * 2b. Return bad request
 * 3. Generate fingerprint
 * 4. Check if fingerprint is reserved
 * 4b. Return bad request if key is reserved
 * 5. Reserve fingerprint (store pubKey)
 */

const isReservePubKeyResponseSuccess = (
  res: IResponseType<number, unknown>
): res is IResponseType<201, NewPubKey> => res.status === 201;

export const lollipopLoginHandler =
  (
    isLollipopEnabled: boolean,
    lollipopApiClient: ReturnType<LollipopApiClient>,
    appInsightsTelemetryClient?: appInsights.TelemetryClient
  ) =>
  async (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorConflict
    | undefined
  > =>
    withValidatedOrValidationError(
      pipe(
        req.headers[LOLLIPOP_PUB_KEY_HEADER_NAME],
        O.fromNullable,
        O.map(JwkPublicKeyFromToken.decode),
        O.bindTo("jwk"),
        O.bind("algo", () =>
          pipe(
            req.headers[LOLLIPOP_PUB_KEY_HASHING_ALGO_HEADER_NAME],
            O.fromNullable,
            O.getOrElseW(() => DEFAULT_LOLLIPOP_HASH_ALGORITHM),
            O.of,
            O.map(LollipopHashAlgorithm.decode)
          )
        ),
        O.map(A.sequenceS(E.Applicative)),
        O.getOrElseW(() => E.right(void 0))
      ),
      (lollipopParams) =>
        pipe(
          isLollipopEnabled,
          B.fold(
            () => O.none,
            () =>
              pipe(
                lollipopParams,
                O.fromNullable,
                O.map(({ algo, jwk }) =>
                  pipe(
                    TE.tryCatch(
                      () =>
                        lollipopApiClient.reservePubKey({
                          body: {
                            algo: JwkPubKeyHashAlgorithmEnum[algo],
                            pub_key: jwk,
                          },
                        }),
                      (e) => {
                        const error = E.toError(e);
                        appInsightsTelemetryClient?.trackEvent({
                          name: getLoginErrorEventName,
                          properties: {
                            message: `Error calling reservePubKey endpoint: ${error.message}`,
                          },
                        });
                        return error;
                      }
                    ),
                    TE.mapLeft(() =>
                      ResponseErrorInternal(
                        "Error while calling reservePubKey API"
                      )
                    ),
                    TE.chainEitherKW(
                      E.mapLeft((err) =>
                        pipe(
                          err,
                          errorsToError,
                          (e) => {
                            appInsightsTelemetryClient?.trackEvent({
                              name: getLoginErrorEventName,
                              properties: {
                                message: `Error calling reservePubKey endpoint: ${e.message}`,
                              },
                            });
                            return e;
                          },
                          () =>
                            ResponseErrorInternal(
                              "Cannot parse reserve response"
                            )
                        )
                      )
                    ),
                    TE.filterOrElseW(
                      isReservePubKeyResponseSuccess,
                      (errorResponse) =>
                        errorResponse.status === 409
                          ? ResponseErrorConflict("PubKey is already reserved")
                          : ResponseErrorInternal("Cannot reserve pubKey")
                    ),
                    TE.map(constUndefined),
                    TE.toUnion
                  )()
                )
              )
          ),
          O.toUndefined
        )
    );
