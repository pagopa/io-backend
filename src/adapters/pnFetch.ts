/* eslint-disable max-params */
import { URL } from "url";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { ProblemJson } from "@pagopa/ts-commons/lib/responses";
import { Response as NodeResponse } from "node-fetch";
import { NotificationAttachmentDownloadMetadataResponse } from "generated/piattaforma-notifiche/NotificationAttachmentDownloadMetadataResponse";
import { match } from "ts-pattern";
import { PnAPIClient } from "../clients/pn-clients";
import { errorsToError } from "../utils/errorsFormatter";
import { pathParamsFromUrl } from "../types/pathParams";
import { ServiceId } from "../../generated/backend/ServiceId";
import { PN_SERVICE_ID } from "../config";

const getPath = (input: RequestInfo): string =>
  pipe(typeof input === "string" ? input : input.url, i => new URL(i).pathname);

export const ThirdPartyMessagesUrl = pathParamsFromUrl(
  RegExp("^[/]+messages[/]+([^/]+)$"),
  ([id]) => `/messages/${id}`
);

export const ThirdPartyAttachmentUrl = pathParamsFromUrl(
  RegExp("^[/]+messages[/]+([^/]+)/(.+)$"),
  ([id, url]) => `/messages/${id}/${url}`
);

const basePnDocument = "[/]{0,1}delivery[/]+notifications[/]+sent[/]+([^/]+)";
const attachmentPnDocument = "[/]+attachments[/]+documents[/]+([^/]+)$";
export const PnDocumentUrl = pathParamsFromUrl(
  RegExp(`${basePnDocument}${attachmentPnDocument}`),
  ([iun, docIdx]) =>
    `/delivery/notifications/sent/${iun}/attachments/documents/${docIdx}`
);

/**
 * Enrich a fetch api with  Accept: "application/io+json"
 */
const withAccept_iojson = (fetchApi: typeof fetch): typeof fetch => async (
  input,
  init
) =>
  fetchApi(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Accept: "application/io+json"
    }
  });

const WithFiscalCode = t.interface({ fiscal_code: FiscalCode });
type WithFiscalCode = t.TypeOf<typeof WithFiscalCode>;

const retrieveNotificationDetails = (
  origFetch: typeof fetch,
  pnUrl: string,
  pnApiKey: string,
  fiscalCode: FiscalCode,
  [_, iun]: ReadonlyArray<string>
) =>
  pipe(
    () =>
      PnAPIClient(pnUrl, withAccept_iojson(origFetch)).getReceivedNotification({
        ApiKeyAuth: pnApiKey,
        iun,
        "x-pagopa-cx-taxid": fiscalCode
      }),
    TE.mapLeft(errorsToError),
    TE.chain(
      TE.fromPredicate(
        r => r.status === 200,
        r => Error(`Failed to fetch PN ReceivedNotification: ${r.status}`)
      )
    ),
    TE.map(response => response.value)
  );

const checkHeaders = (
  headers?: HeadersInit
): TE.TaskEither<Error, WithFiscalCode> =>
  pipe(
    headers,
    O.fromNullable,
    E.fromOption(() => Error("Missing fiscal_code in headers")),
    E.chain(flow(WithFiscalCode.decode, E.mapLeft(errorsToError))),
    TE.fromEither
  );

export const errorResponse = (error: Error): Response =>
  pipe(
    {
      detail: error.message,
      status: 500,
      title: "Error fetching PN data"
    },
    ProblemJson.encode,
    problem =>
      (new NodeResponse(JSON.stringify(problem), {
        status: problem.status,
        statusText: problem.title
      }) as unknown) as Response // cast required: the same cast is used in clients code generation
  );

export const redirectMessages = (
  origFetch: typeof fetch,
  pnUrl: string,
  pnApiKey: string,
  url: string,
  init?: RequestInit
) => (): Promise<Response> =>
  pipe(
    init?.headers,
    checkHeaders,
    TE.chain(headers =>
      pipe(
        url,
        ThirdPartyMessagesUrl.decode,
        E.mapLeft(errorsToError),
        TE.fromEither,
        TE.chain(params =>
          pipe(
            retrieveNotificationDetails(
              origFetch,
              pnUrl,
              pnApiKey,
              headers.fiscal_code,
              params
            )
          )
        )
      )
    ),
    TE.map(
      body =>
        (new NodeResponse(JSON.stringify(body), {
          status: 200,
          statusText: "OK"
        }) as unknown) as Response // cast required: the same cast is used in clients code generation
    ),
    TE.mapLeft(errorResponse),
    TE.toUnion
  )();

const getPnDocumentUrl = (
  origFetch: typeof fetch,
  pnUrl: string,
  pnApiKey: string,
  url: string,
  fiscalCode: FiscalCode
): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    url,
    PnDocumentUrl.decode,
    E.mapLeft(errorsToError),
    TE.fromEither,
    TE.chain(([_, iun, docIdx]) =>
      pipe(
        TE.tryCatch(
          () =>
            PnAPIClient(pnUrl, origFetch).getSentNotificationDocument({
              ApiKeyAuth: pnApiKey,
              docIdx: Number(docIdx),
              iun,
              "x-pagopa-cx-taxid": fiscalCode
            }),
          E.toError
        ),
        TE.chainEitherK(E.mapLeft(errorsToError)),
        TE.chain(
          TE.fromPredicate(
            r => r.status === 200,
            r =>
              Error(`Failed to fetch PN SentNotificationDocument: ${r.status}`)
          )
        ),
        TE.map(
          response =>
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            (response.value as NotificationAttachmentDownloadMetadataResponse)
              .url
        ),
        TE.chainEitherK(flow(NonEmptyString.decode, E.mapLeft(errorsToError)))
      )
    )
  );

export const redirectAttachment = (
  origFetch: typeof fetch,
  pnUrl: string,
  pnApiKey: string,
  url: string,
  init?: RequestInit
) => (): Promise<Response> =>
  pipe(
    init?.headers,
    checkHeaders,
    TE.chain(headers =>
      pipe(
        url,
        ThirdPartyAttachmentUrl.decode,
        E.mapLeft(errorsToError),
        TE.fromEither,
        TE.chain(([_, _id, getAttachmentUrl]) =>
          match(getAttachmentUrl)
            .when(
              au => E.isRight(PnDocumentUrl.decode(au)),
              au =>
                getPnDocumentUrl(
                  origFetch,
                  pnUrl,
                  pnApiKey,
                  au,
                  headers.fiscal_code
                )
            )
            .otherwise(au =>
              TE.left(
                new Error(
                  `Can not find a Piattaforma Notifiche get attachment implementation for ${au}`
                )
              )
            )
        ),
        TE.chain(attachmentBinaryUrl =>
          TE.tryCatch(() => origFetch(attachmentBinaryUrl), E.toError)
        ),
        TE.chain(
          TE.fromPredicate(
            r => r.status === 200,
            r => Error(`Failed to fetch PN download attachment: ${r.status}`)
          )
        )
      )
    ),
    TE.mapLeft(errorResponse),
    TE.toUnion
  )();

export const pnFetch = (
  origFetch: typeof fetch = fetch,
  serviceId: ServiceId,
  pnUrl: string,
  pnApiKey: string
): typeof fetch => (input, init) =>
  serviceId === PN_SERVICE_ID
    ? match(getPath(input))
        .when(
          url => E.isRight(ThirdPartyMessagesUrl.decode(url)),
          url => redirectMessages(origFetch, pnUrl, pnApiKey, url, init)
        )
        .when(
          url => E.isRight(ThirdPartyAttachmentUrl.decode(url)),
          url => redirectAttachment(origFetch, pnUrl, pnApiKey, url, init)
        )
        .otherwise(url =>
          pipe(
            TE.left(
              new Error(
                `Can not find a Piattaforma Notifiche implementation for ${url}`
              )
            ),
            TE.mapLeft(errorResponse),
            TE.toUnion
          )
        )()
    : origFetch(input, init);
