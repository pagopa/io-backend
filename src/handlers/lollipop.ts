import { LOLLIPOP_PUB_KEY_HEADER_NAME } from "@pagopa/io-spid-commons/dist/types/lollipop";
import { JwkPublicKeyFromToken } from "@pagopa/ts-commons/lib/jwk";
import * as express from "express";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import { withValidatedOrValidationError } from "src/utils/responses";
import {
  IResponseErrorInternal,
  IResponseErrorValidation
} from "@pagopa/ts-commons/lib/responses";

/**
 * 1. Read pubkey header
 * 2. Decode key
 * 2b. Return bad request
 * 3. Generate fingerprint
 * 4. Check if fingerprint is reserved
 * 4b. Return bad request if key is reserved
 * 5. Reserve fingerprint (store pubKey)
 */

export const lollipopLoginHandler = () => async (
  req: express.Request
): Promise<IResponseErrorValidation | IResponseErrorInternal | undefined> =>
  withValidatedOrValidationError(
    pipe(
      req.headers[LOLLIPOP_PUB_KEY_HEADER_NAME],
      O.fromNullable,
      O.map(JwkPublicKeyFromToken.decode),
      O.getOrElseW(() => E.right(void 0))
    ),
    _ =>
      // TODO:
      void 0
  );
