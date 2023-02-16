import {
  DEFAULT_LOLLIPOP_HASH_ALGORITHM,
  LollipopHashAlgorithm,
  LOLLIPOP_PUB_KEY_HASHING_ALGO_HEADER_NAME,
  LOLLIPOP_PUB_KEY_HEADER_NAME
} from "@pagopa/io-spid-commons/dist/types/lollipop";
import { JwkPublicKeyFromToken } from "@pagopa/ts-commons/lib/jwk";
import * as express from "express";
import { constUndefined, flow, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Apply";
import * as TE from "fp-ts/lib/TaskEither";
import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorValidation,
  ResponseErrorConflict,
  ResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";
import { LollipopApiClient } from "src/clients/lollipop";
import { JwkPubKeyHashAlgorithmEnum } from "generated/lollipop-api/JwkPubKeyHashAlgorithm";
import { errorsToError } from "src/utils/errorsFormatter";
import { NewPubKey } from "generated/lollipop-api/NewPubKey";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { withValidatedOrValidationError } from "../utils/responses";

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

export const lollipopLoginHandler = (
  lollipopApiClient: ReturnType<LollipopApiClient>
) => async (
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
          O.chainNullableK(() => DEFAULT_LOLLIPOP_HASH_ALGORITHM),
          O.map(LollipopHashAlgorithm.decode)
        )
      ),
      O.map(A.sequenceS(E.Applicative)),
      O.getOrElseW(() => E.right(void 0))
    ),
    flow(
      O.fromNullable,
      O.map(({ algo, jwk }) =>
        pipe(
          TE.tryCatch(
            () =>
              lollipopApiClient.reservePubKey({
                body: {
                  algo: JwkPubKeyHashAlgorithmEnum[algo],
                  pub_key: jwk
                }
              }),
            E.toError
          ),
          TE.mapLeft(() =>
            ResponseErrorInternal("Error while calling pubKey reservation")
          ),
          TE.chainEitherKW(E.mapLeft(errorsToError)),
          TE.mapLeft(() =>
            ResponseErrorInternal("Cannot parse reserve response")
          ),
          TE.filterOrElseW(isReservePubKeyResponseSuccess, errorResponse =>
            errorResponse.status === 409
              ? ResponseErrorConflict("PubKey is already reserved")
              : ResponseErrorInternal("Cannot reserve pubKey")
          ),
          TE.map(constUndefined),
          TE.toUnion
        )()
      ),
      O.toUndefined
    )
  );
