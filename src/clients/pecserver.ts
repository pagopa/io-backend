import nodeFetch from "node-fetch";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { ResponseErrorInternal } from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Second } from "italia-ts-commons/lib/units";
import {
  getHttpApiFetchWithBearer,
  PECSERVER_BASE_PATH,
  PECSERVER_URL,
  PECSERVER_TOKEN_SECRET,
  PECSERVER_TOKEN_EXPIRATION,
  PECSERVER_TOKEN_ISSUER
} from "../config";
import * as pecClient from "../../generated/pecserver/client";

export const pecServerClient = (
  baseUrl: string,
  fetchApi: typeof fetch = (nodeFetch as unknown) as typeof fetch // TODO: customize fetch with timeout
): pecClient.Client =>
  pecClient.createClient({
    basePath: "",
    baseUrl,
    fetchApi
  });

export type IPecServerClient = typeof pecServerClient;

export const getPecServerJwt = (
  tokenService: {
    readonly getPecServerTokenHandler: (
      fiscalCode: FiscalCode,
      secret: NonEmptyString,
      tokenTtl: Second,
      issuer: NonEmptyString
    ) => () => TE.TaskEither<Error, string>;
  },
  fiscalCode: FiscalCode
) =>
  tokenService
    .getPecServerTokenHandler(
      fiscalCode,
      PECSERVER_TOKEN_SECRET,
      PECSERVER_TOKEN_EXPIRATION,
      PECSERVER_TOKEN_ISSUER
    )()
    .mapLeft(e =>
      ResponseErrorInternal(`Error computing the PEC Server JWT: ${e.message}`)
    );

export const getAttachmentBody = (
  bearer: string,
  legalMessageId: string,
  attachmentId: string
): TE.TaskEither<Error, Buffer> =>
  TE.tryCatch(
    () =>
      getHttpApiFetchWithBearer(bearer)(
        `${PECSERVER_URL}${PECSERVER_BASE_PATH}/messages/${legalMessageId}/attachments/${attachmentId}`
      ),
    E.toError
  )
    .chain(
      TE.fromPredicate(
        r => r.status === 200,
        r => new Error(`failed to fetch attachment: ${r.status}`)
      )
    )
    .chain<Buffer>(rawResponse =>
      TE.tryCatch(() => rawResponse.arrayBuffer(), E.toError).map(Buffer.from)
    );
