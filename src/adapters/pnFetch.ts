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
import { LollipopLocalsType } from "src/types/lollipop";
import { Fetch } from "src/clients/third-party-service-client";
import nodeFetch from "node-fetch";
import { eventLog } from "@pagopa/winston-ts";
import { PnAPIClient } from "../clients/pn-clients";
import { errorsToError } from "../utils/errorsFormatter";
import { pathParamsFromUrl } from "../types/pathParams";
import { ServiceId } from "../../generated/backend/ServiceId";
import { PN_SERVICE_ID } from "../config";

const getPath = (input: RequestInfo | URL): string =>
  input instanceof URL
    ? `${input.pathname}${input.searchParams}`
    : typeof input === "string"
    ? `${new URL(input).pathname}${new URL(input).searchParams}`
    : `${new URL(input.url).pathname}${new URL(input.url).searchParams}`;

export const ThirdPartyMessagesUrl = pathParamsFromUrl(
  RegExp("^[/]+messages[/]+([^/]+)$"),
  ([id]) => `/messages/${id}`
);

export const ThirdPartyAttachmentUrl = pathParamsFromUrl(
  RegExp("^[/]+messages[/]+([^/]+)/(.+)$"),
  ([id, url]) => `/messages/${id}/${url}`
);

export const ThirdPartyPreconditionUrl = pathParamsFromUrl(
  RegExp("^[/]+messages[/]+([^/]+)/precondition$"),
  ([id]) => `/messages/${id}/precondition`
);

// document path
const basePnDocument =
  "[/]{0,1}delivery[/]+notifications[/]+received[/]+([^/]+)";
const attachmentPnDocument = "[/]+attachments[/]+documents[/]+([^/]+)$";
export const PnDocumentUrl = pathParamsFromUrl(
  RegExp(`${basePnDocument}${attachmentPnDocument}`),
  ([iun, docIdx]) =>
    `/delivery/notifications/received/${iun}/attachments/documents/${docIdx}`
);

// payment path
const attachmentPnPayment =
  "[/]?attachments[/]?payment[/]?([^/?]+)?.+attachmentIdx=([^&]+).*$";
export const PnPaymentUrl = pathParamsFromUrl(
  RegExp(`${basePnDocument}${attachmentPnPayment}`),
  ([iun, docName, docIdx]) =>
    `/delivery/notifications/received/${iun}/attachments/payment/${docName}/?attachmentIdx=${docIdx}`
);

/**
 * Enrich a fetch api with  Accept: "application/io+json"
 */
const withAccept_iojson =
  (fetchApi: typeof fetch): typeof fetch =>
  async (input, init) =>
    fetchApi(input, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Accept: "application/io+json",
      },
    });

const WithFiscalCode = t.interface({ fiscal_code: FiscalCode });
type WithFiscalCode = t.TypeOf<typeof WithFiscalCode>;

const retrievePrecondition = (
  origFetch: typeof fetch,
  pnUrl: string,
  pnApiKey: string,
  fiscalCode: FiscalCode,
  [iun]: ReadonlyArray<string>,
  lollipopLocals?: LollipopLocalsType
) =>
  pipe(
    () =>
      // we use the origFetch because this api is generic and needs only the standard accept header application/json
      PnAPIClient(pnUrl, origFetch).getReceivedNotificationPrecondition({
        ApiKeyAuth: pnApiKey,
        iun,
        "x-pagopa-cx-taxid": fiscalCode,
        ...lollipopLocals,
      }),
    TE.mapLeft(errorsToError),
    TE.chain(
      TE.fromPredicate(
        (r) => r.status === 200,
        (r) => Error(`Failed to fetch PN ReceivedPrecondition: ${r.status}`)
      )
    ),
    TE.map((response) => response.value)
  );

const retrieveNotificationDetails = (
  origFetch: typeof fetch,
  pnUrl: string,
  pnApiKey: string,
  fiscalCode: FiscalCode,
  [iun]: ReadonlyArray<string>,
  lollipopLocals?: LollipopLocalsType
) =>
  pipe(
    () =>
      PnAPIClient(pnUrl, withAccept_iojson(origFetch)).getReceivedNotification({
        ApiKeyAuth: pnApiKey,
        iun,
        "x-pagopa-cx-taxid": fiscalCode,
        ...lollipopLocals,
      }),
    TE.mapLeft(errorsToError),
    TE.chain(
      TE.fromPredicate(
        (r) => r.status === 200,
        (r) => Error(`Failed to fetch PN ReceivedNotification: ${r.status}`)
      )
    ),
    TE.map((response) => response.value)
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
      title: "Error fetching PN data",
    },
    ProblemJson.encode,
    (problem) =>
      new NodeResponse(JSON.stringify(problem), {
        status: problem.status,
        statusText: problem.title,
      }) as unknown as Response // cast required: the same cast is used in clients code generation
  );

export const retryResponse = (retryAfter: number): Response =>
  pipe(
    {
      detail: "Data is not ready yet",
      status: 503,
      title: "Error fetching PN data",
    },
    ProblemJson.encode,
    (problem) =>
      new NodeResponse(JSON.stringify(problem), {
        headers: { "Retry-After": `${retryAfter}` },
        status: problem.status,
        statusText: problem.title,
      }) as unknown as Response // cast required: the same cast is used in clients code generation
  );

export const redirectPrecondition =
  (
    origFetch: typeof fetch,
    pnUrl: string,
    pnApiKey: string,
    url: string,
    lollipopLocals?: LollipopLocalsType,
    init?: RequestInit
  ) =>
  (): Promise<Response> =>
    pipe(
      init?.headers,
      checkHeaders,
      TE.chain((headers) =>
        pipe(
          url,
          ThirdPartyPreconditionUrl.decode,
          E.mapLeft(errorsToError),
          TE.fromEither,
          eventLog.taskEither.info((_) => [
            `pn.precondition.call`,
            {
              locals: lollipopLocals
                ? Object.keys(lollipopLocals)
                : "No lollipop locals",
              name: "pn.precondition.call",
            },
          ]),
          TE.chain((params) =>
            pipe(
              retrievePrecondition(
                origFetch,
                pnUrl,
                pnApiKey,
                headers.fiscal_code,
                params,
                lollipopLocals
              )
            )
          )
        )
      ),
      TE.map(
        // eslint-disable-next-line sonarjs/no-identical-functions
        (body) =>
          new NodeResponse(JSON.stringify(body), {
            status: 200,
            statusText: "OK",
          }) as unknown as Response // cast required: the same cast is used in clients code generation
      ),
      eventLog.taskEither.errorLeft(({ message }) => [
        `Something went wrong trying to call retrievePrecondition`,
        { message, name: "pn.precondition.error" },
      ]),
      TE.mapLeft(errorResponse),
      TE.toUnion
    )();

export const redirectMessages =
  (
    origFetch: typeof fetch,
    pnUrl: string,
    pnApiKey: string,
    url: string,
    lollipopLocals?: LollipopLocalsType,
    init?: RequestInit
  ) =>
  (): Promise<Response> =>
    pipe(
      init?.headers,
      checkHeaders,
      TE.chain((headers) =>
        pipe(
          url,
          ThirdPartyMessagesUrl.decode,
          E.mapLeft(errorsToError),
          TE.fromEither,
          eventLog.taskEither.info((_) => [
            `pn.notification.call`,
            {
              locals: lollipopLocals
                ? Object.keys(lollipopLocals)
                : "No lollipop locals",
              name: "pn.notification.call",
            },
          ]),
          TE.chain((params) =>
            pipe(
              retrieveNotificationDetails(
                origFetch,
                pnUrl,
                pnApiKey,
                headers.fiscal_code,
                params,
                lollipopLocals
              )
            )
          )
        )
      ),
      TE.map(
        // eslint-disable-next-line sonarjs/no-identical-functions
        (body) =>
          new NodeResponse(JSON.stringify(body), {
            status: 200,
            statusText: "OK",
          }) as unknown as Response // cast required: the same cast is used in clients code generation
      ),
      eventLog.taskEither.errorLeft(({ message }) => [
        `Something went wrong trying to call retrieveNotificationDetails`,
        { message, name: "pn.notification.error" },
      ]),
      TE.mapLeft(errorResponse),
      TE.toUnion
    )();

const getPnDocument = (
  origFetch: typeof fetch,
  pnUrl: string,
  pnApiKey: string,
  url: string,
  fiscalCode: FiscalCode,
  lollipopLocals?: LollipopLocalsType
): TE.TaskEither<Error, NotificationAttachmentDownloadMetadataResponse> =>
  pipe(
    url,
    PnDocumentUrl.decode,
    E.mapLeft(errorsToError),
    TE.fromEither,
    TE.chain(([iun, docIdx]) =>
      pipe(
        TE.tryCatch(
          () =>
            PnAPIClient(pnUrl, origFetch).getSentNotificationDocument({
              ApiKeyAuth: pnApiKey,
              docIdx: Number(docIdx),
              iun,
              "x-pagopa-cx-taxid": fiscalCode,
              ...lollipopLocals,
            }),
          E.toError
        ),
        TE.chainEitherK(E.mapLeft(errorsToError)),
        TE.chain(
          TE.fromPredicate(
            (r) => r.status === 200,
            (r) =>
              Error(`Failed to fetch PN SentNotificationDocument: ${r.status}`)
          )
        ),
        TE.map(
          (response) =>
            response.value as NotificationAttachmentDownloadMetadataResponse
        )
      )
    )
  );

const getPnPayment = (
  origFetch: typeof fetch,
  pnUrl: string,
  pnApiKey: string,
  url: string,
  fiscalCode: FiscalCode,
  lollipopLocals?: LollipopLocalsType
): TE.TaskEither<Error, NotificationAttachmentDownloadMetadataResponse> =>
  pipe(
    url,
    PnPaymentUrl.decode,
    E.mapLeft(errorsToError),
    TE.fromEither,
    TE.chain(([iun, docName, docIdx]) =>
      pipe(
        TE.tryCatch(
          () =>
            PnAPIClient(pnUrl, origFetch).getReceivedNotificationAttachment({
              ApiKeyAuth: pnApiKey,
              attachmentIdx: Number(docIdx),
              attachmentName: docName,
              iun,
              "x-pagopa-cx-taxid": fiscalCode,
              ...lollipopLocals,
            }),
          E.toError
        ),
        TE.chainEitherK(E.mapLeft(errorsToError)),
        TE.chain(
          TE.fromPredicate(
            (r) => r.status === 200,
            (r) =>
              Error(
                `Failed to fetch PN ReceivedNotificationAttachment: ${r.status}`
              )
          )
        ),
        TE.map(
          (response) =>
            response.value as NotificationAttachmentDownloadMetadataResponse
        )
      )
    )
  );

export const redirectAttachment =
  (
    origFetch: typeof fetch,
    pnUrl: string,
    pnApiKey: string,
    url: string,
    lollipopLocals?: LollipopLocalsType,
    init?: RequestInit
  ) =>
  (): Promise<Response> =>
    pipe(
      init?.headers,
      checkHeaders,
      TE.chain((headers) =>
        pipe(
          url,
          ThirdPartyAttachmentUrl.decode,
          E.mapLeft(errorsToError),
          TE.fromEither,
          TE.chain(([_id, getAttachmentUrl]) =>
            match(getAttachmentUrl)
              .when(
                (au) => E.isRight(PnDocumentUrl.decode(au)),
                (au) => {
                  eventLog.peek.info([
                    `Calling PN with lollipopLocals: ${lollipopLocals}`,
                    { name: "lollipo.pn.api.attachment" },
                  ]);
                  return getPnDocument(
                    origFetch,
                    pnUrl,
                    pnApiKey,
                    au,
                    headers.fiscal_code,
                    lollipopLocals
                  );
                }
              )
              .when(
                (au) => E.isRight(PnPaymentUrl.decode(au)),
                (au) => {
                  eventLog.peek.info([
                    `Calling PN with lollipopLocals: ${lollipopLocals}`,
                    { name: "lollipo.pn.api.payment" },
                  ]);
                  return getPnPayment(
                    origFetch,
                    pnUrl,
                    pnApiKey,
                    au,
                    headers.fiscal_code,
                    lollipopLocals
                  );
                }
              )
              .otherwise((au) =>
                TE.left(
                  new Error(
                    `Can not find a Piattaforma Notifiche get attachment implementation for ${au}`
                  )
                )
              )
          ),
          TE.chain((attachment) =>
            pipe(
              attachment.url,
              NonEmptyString.decode,
              E.map((u) =>
                pipe(
                  TE.tryCatch(() => origFetch(u), E.toError),
                  TE.chain(
                    TE.fromPredicate(
                      (r) => r.status === 200,
                      (r) =>
                        Error(
                          `Failed to fetch PN download attachment: ${r.status}`
                        )
                    )
                  )
                )
              ),
              E.getOrElse((_) =>
                pipe(
                  attachment.retryAfter,
                  t.number.decode,
                  E.mapLeft(errorsToError),
                  TE.fromEither,
                  TE.map((r) => retryResponse(r))
                )
              )
            )
          )
        )
      ),
      eventLog.taskEither.errorLeft(({ message }) => [
        `Something went wrong trying to call getPnDocumentUrl`,
        { message, name: "pn.attachment.error" },
      ]),
      TE.mapLeft(errorResponse),
      TE.toUnion
    )();

export const pnFetch =
  (
    origFetch: Fetch = nodeFetch as unknown as Fetch,
    serviceId: ServiceId,
    pnUrl: string,
    pnApiKey: string,
    lollipopLocals?: LollipopLocalsType
  ): typeof fetch =>
  (input, init) => {
    eventLog.peek.info(
      serviceId === PN_SERVICE_ID
        ? [`Calling PN api`, { name: "lollipop.pn.api" }]
        : ["Calling third party api", { name: "lollipop.third-party.api" }]
    );
    return serviceId === PN_SERVICE_ID
      ? match(getPath(input))
          .when(
            (url) => E.isRight(ThirdPartyMessagesUrl.decode(url)),
            (url) =>
              redirectMessages(
                origFetch,
                pnUrl,
                pnApiKey,
                url,
                lollipopLocals,
                init
              )
          )
          .when(
            (url) => E.isRight(ThirdPartyPreconditionUrl.decode(url)),
            (url) =>
              redirectPrecondition(
                origFetch,
                pnUrl,
                pnApiKey,
                url,
                lollipopLocals,
                init
              )
          )
          .when(
            (url) => E.isRight(ThirdPartyAttachmentUrl.decode(url)),
            (url) =>
              redirectAttachment(
                origFetch,
                pnUrl,
                pnApiKey,
                url,
                lollipopLocals,
                init
              )
          )
          .otherwise((url) =>
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
  };
