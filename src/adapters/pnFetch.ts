/* eslint-disable max-params */
import { URL } from "url";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import * as O from "fp-ts/Option";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { ProblemJson } from "@pagopa/ts-commons/lib/responses";
import { Response as NodeResponse } from "node-fetch";
import { NotificationDocument } from "generated/piattaforma-notifiche/NotificationDocument";
import { FullReceivedNotification } from "../../generated/piattaforma-notifiche/FullReceivedNotification";
import { ThirdPartyAttachment } from "../../generated/third-party-service/ThirdPartyAttachment";
import { ThirdPartyMessageDetail } from "../../generated/third-party-service/ThirdPartyMessageDetail";
import { NotificationAttachmentDownloadMetadataResponse } from "../../generated/piattaforma-notifiche/NotificationAttachmentDownloadMetadataResponse";
import { PnAPIClient } from "../clients/pn-client";
import { errorsToError } from "../utils/errorsFormatter";
import { pathParamsFromUrl } from "../types/pathParams";

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

const WithFiscalCode = t.interface({ fiscal_code: NonEmptyString });
type WithFiscalCode = t.TypeOf<typeof WithFiscalCode>;

const retrieveNotificationDetails = (
  origFetch: typeof fetch,
  pnUrl: string,
  pnApiKey: string,
  headers: WithFiscalCode,
  [_, iun]: ReadonlyArray<string>
) =>
  pipe(
    () =>
      PnAPIClient(pnUrl, origFetch).getReceivedNotification({
        ApiKeyAuth: pnApiKey,
        iun,
        "x-pagopa-cx-taxid": headers.fiscal_code
      }),
    TE.mapLeft(errorsToError),
    TE.chain(
      TE.fromPredicate(
        r => r.status === 200,
        r => Error(`Failed to fetch PN ReceivedNotification: ${r.status}`)
      )
    ),
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    TE.map(response => response.value as FullReceivedNotification)
  );

const retrieveAttachmentsMetadata = (
  origFetch: typeof fetch,
  pnUrl: string,
  pnApiKey: string,
  headers: WithFiscalCode,
  [_, iun]: ReadonlyArray<string>,
  { docIdx }: NotificationDocument
) =>
  pipe(
    () =>
      PnAPIClient(pnUrl, origFetch).getSentNotificationDocument({
        ApiKeyAuth: pnApiKey,
        docIdx: Number(docIdx),
        iun,
        "x-pagopa-cx-taxid": headers.fiscal_code
      }),
    TE.mapLeft(errorsToError),
    TE.chain(
      TE.fromPredicate(
        r => r.status === 200,
        r => Error(`Failed to fetch PN SentNotificationDocument: ${r.status}`)
      )
    ),
    TE.map(
      response =>
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        response.value as NotificationAttachmentDownloadMetadataResponse
    ),
    TE.chainEitherK(metadata =>
      pipe(
        {
          content_type: metadata.contentType,
          id: `D${docIdx}`,
          name: metadata.filename,
          url: new URL(metadata.url ?? "").pathname
        },
        ThirdPartyAttachment.decode,
        E.mapLeft(errorsToError)
      )
    )
  );

const checkHeaders = (headers?: HeadersInit) =>
  pipe(
    headers,
    O.fromNullable,
    E.fromOption(() => Error("Missing fiscal_code in headers")),
    E.chain(flow(WithFiscalCode.decode, E.mapLeft(errorsToError))),
    TE.fromEither
  );

const errorResponse = (error: Error) =>
  pipe(
    {
      detail: error.message,
      status: 500,
      title: "Error fetching PN data"
    },
    ProblemJson.encode,
    problem =>
      (new NodeResponse(JSON.stringify(error), {
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
) => () =>
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
              headers,
              params
            ),
            TE.chain(receivedNotification =>
              pipe(
                receivedNotification.documents,
                RA.map(document =>
                  retrieveAttachmentsMetadata(
                    origFetch,
                    pnUrl,
                    pnApiKey,
                    headers,
                    params,
                    document
                  )
                ),
                TE.sequenceArray,
                TE.map(attachments =>
                  ThirdPartyMessageDetail.encode({
                    attachments,
                    details: receivedNotification
                  })
                )
              )
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

export const redirectAttachment = (
  origFetch: typeof fetch,
  pnUrl: string,
  url: string
) => () =>
  pipe(
    url,
    ThirdPartyAttachmentUrl.decode,
    E.mapLeft(errorsToError),
    TE.fromEither,
    TE.chainEitherK(
      ([_path, _id, attachmentRelativeUrl]: ReadonlyArray<string>) =>
        E.tryCatch(() => new URL(attachmentRelativeUrl, pnUrl), E.toError)
    ),
    TE.chain(attachmentAbsoluteUrl =>
      TE.tryCatch(() => origFetch(attachmentAbsoluteUrl.toString()), E.toError)
    ),
    TE.chain(
      TE.fromPredicate(
        r => r.status === 200,
        r => Error(`Failed to fetch PN download attachment: ${r.status}`)
      )
    ),
    TE.mapLeft(errorResponse),
    TE.toUnion
  )();

export const pnFetch = (
  origFetch: typeof fetch = fetch,
  pnUrl: string,
  pnApiKey: string
): typeof fetch => (input: RequestInfo, init?: RequestInit) =>
  pipe(input, getPath, url =>
    E.isRight(ThirdPartyMessagesUrl.decode(url))
      ? redirectMessages(origFetch, pnUrl, pnApiKey, url, init)
      : E.isRight(ThirdPartyAttachmentUrl.decode(url))
      ? redirectAttachment(origFetch, pnUrl, url)
      : () => {
          throw Error(
            `Can not find a Piattaforma Notifiche implementation for ${url}`
          );
        }
  )();
