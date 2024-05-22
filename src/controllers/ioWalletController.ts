/**
 * This controller handles the IO_WALLET requests from the
 * app by forwarding the call to the API system.
 */

import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

import { IResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";

import { pipe } from "fp-ts/lib/function";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import IoWalletService from "../services/ioWalletService";
import { UserDetailView } from "generated/io-wallet-api/UserDetailView";

export const retrieveUserId = (
  ioWalletService: IoWalletService,
  fiscalCode: FiscalCode
) =>
  pipe(
    TE.tryCatch(
      () => ioWalletService.getUserByFiscalCode(fiscalCode),
      E.toError
    ),
    TE.chain(
      TE.fromPredicate(
        (r): r is IResponseSuccessJson<UserDetailView> =>
          r.kind === "IResponseSuccessJson",
        (e) =>
          new Error(
            `An error occurred while retrieving the User id. | ${e.detail}`
          )
      )
    )
  );
