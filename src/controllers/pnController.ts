import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { PNActivation } from "../../generated/api_piattaforma-notifiche-courtesy/PNActivation";
import { PNEnvironment } from "../clients/pn-clients";
import { PNService } from "../services/pnService";
import { withUserFromRequest } from "../types/user";
import {
  IResponseNoContent,
  ResponseNoContent,
  withValidatedOrValidationError,
} from "../utils/responses";

/**
 * Upsert the Activation for `Avvisi di Cortesia` Piattaforma Notifiche
 * Special Service
 */
export const upsertPNActivationController =
  (upsertPnActivation: ReturnType<typeof PNService>["upsertPnActivation"]) =>
  (
    req: express.Request,
  ): Promise<
    IResponseErrorInternal | IResponseErrorValidation | IResponseNoContent
  > =>
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(PNActivation.decode(req.body), (payload) =>
        pipe(
          O.fromNullable(req.query.isTest),
          O.map((_) => _.toString().toLowerCase() === "true"),
          O.getOrElse(() => false),
          TE.of,
          TE.map((isTest) =>
            isTest ? PNEnvironment.UAT : PNEnvironment.PRODUCTION,
          ),
          TE.chainW((pnEnvironment) =>
            pipe(
              TE.tryCatch(
                () =>
                  upsertPnActivation(pnEnvironment, user.fiscal_code, {
                    activationStatus: payload.activation_status,
                  }),
                () => ResponseErrorInternal("Error calling the PN service"),
              ),
              TE.chainEitherKW(
                E.mapLeft(() =>
                  ResponseErrorInternal("Unexpected PN service response"),
                ),
              ),
            ),
          ),
          TE.map((_) => {
            switch (_.status) {
              case 204:
                return ResponseNoContent();
              case 400:
                return ResponseErrorInternal(
                  "PN service response is bad request",
                );
              default:
                return ResponseErrorInternal("Unexpected response status code");
            }
          }),
          TE.toUnion,
        )(),
      ),
    );

export const getPNActivationController =
  (getPnActivation: ReturnType<typeof PNService>["getPnActivation"]) =>
  (
    req: express.Request,
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<PNActivation>
  > =>
    withUserFromRequest(req, async (user) =>
      pipe(
        O.fromNullable(req.query.isTest),
        O.map((_) => _.toString().toLowerCase() === "true"),
        O.getOrElse(() => false),
        TE.of,
        TE.map((isTest) =>
          isTest ? PNEnvironment.UAT : PNEnvironment.PRODUCTION,
        ),
        TE.chainW((pnEnvironment) =>
          pipe(
            TE.tryCatch(
              () => getPnActivation(pnEnvironment, user.fiscal_code),
              () => ResponseErrorInternal("Error calling the PN service"),
            ),
            TE.chainEitherKW(
              E.mapLeft(() =>
                ResponseErrorInternal("Unexpected PN service response"),
              ),
            ),
          ),
        ),
        TE.map((pnActivationResponse) => {
          switch (pnActivationResponse.status) {
            case 200:
              return ResponseSuccessJson({
                activation_status: pnActivationResponse.value.activationStatus,
              });
            case 404:
              // When the activation is missing on PN
              // false default value was returned.
              return ResponseSuccessJson({
                activation_status: false,
              });
            case 400:
              return ResponseErrorInternal(
                "PN service response is bad request",
              );
            default:
              return ResponseErrorInternal("Unexpected response status code");
          }
        }),
        TE.toUnion,
      )(),
    );
