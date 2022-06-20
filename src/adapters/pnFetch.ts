import { URL } from "url";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import * as O from "fp-ts/Option";
import { pathParamsFromUrl } from "src/types/pathParams";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { errorsToError } from "src/utils/errorsFormatter";
import { PnAPIClient } from "src/clients/pn-client";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { FullReceivedNotification } from "generated/piattaforma-notifiche/FullReceivedNotification";
import { ThirdPartyAttachment } from "generated/third-party-service/ThirdPartyAttachment";
import { ThirdPartyMessageDetail } from "generated/third-party-service/ThirdPartyMessageDetail";
import { NotificationAttachmentDownloadMetadataResponse } from "generated/piattaforma-notifiche/NotificationAttachmentDownloadMetadataResponse";
import { ProblemJson } from "@pagopa/ts-commons/lib/responses";

const getUrl = (input: RequestInfo): string =>
  typeof input === "string" ? input : input.url;

export const ThirdPartyMessagesUrl = pathParamsFromUrl(
  RegExp("^/messages/([^/]+)$"),
  ([id]) => `/messages/${id}`
);

const WithFiscalCode = t.interface({ fiscal_code: NonEmptyString });

// IResponseType<S extends number, T, H extends string = never>
// export const Aaa =  new t.Type<ReadonlyArray<string>, string, unknown>(
//     "Ass",
//     (u: unknown): u is ReadonlyArray<string> =>
//       Array.isArray(u) && u.every(value => typeof value === "string"),
//     (input, context) =>
//       pipe(
//         input,
//         t.string.decode,
//         E.chain(
//           E.fromPredicate(
//             i => decodeTemplate.test(i),
//             createSingleError(
//               input,
//               context,
//               `input is not a valid ${decodeTemplate}`
//             )
//           )
//         ),
//         E.map(i => decodeTemplate.exec(i)),
//         E.map(O.fromNullable),
//         E.chain(
//           E.fromOption(
//             createSingleError(
//               input,
//               context,
//               `Should not be here: input is a valid decodeTemplate but its execution failed!`
//             )
//           )
//         )
//       ),
//     encodeTemplate
//   );

export const redirectMessages = (
  origFetch: typeof fetch,
  pnUrl: string,
  pnApiKey: string,
  url: string,
  init?: RequestInit
) => () =>
  pipe(
    init?.headers,
    O.fromNullable,
    E.fromOption(() => Error("Missing fiscal_code in headers")),
    E.chain(flow(WithFiscalCode.decode, E.mapLeft(errorsToError))),
    TE.fromEither,
    TE.chain(headers =>
      pipe(
        url,
        ThirdPartyMessagesUrl.decode,
        E.mapLeft(errorsToError),
        TE.fromEither,
        TE.chain(params =>
          pipe(
            () =>
              PnAPIClient(pnUrl, origFetch).getReceivedNotification({
                ApiKeyAuth: pnApiKey,
                iun: params[0],
                "x-pagopa-cx-taxid": headers.fiscal_code
              }),
            TE.mapLeft(errorsToError),
            TE.chain(
              TE.fromPredicate(
                r => r.status === 200,
                r =>
                  Error(`Failed to fetch PN ReceivedNotification: ${r.status}`)
              )
            ),
            TE.map(response => response.value as FullReceivedNotification),
            TE.chain(receivedNotification =>
              pipe(
                receivedNotification.documents,
                RA.map(document =>
                  pipe(
                    () =>
                      PnAPIClient(pnUrl, origFetch).getSentNotificationDocument(
                        {
                          ApiKeyAuth: pnApiKey,
                          docIdx: Number(document.docIdx),
                          iun: params[0],
                          "x-pagopa-cx-taxid": headers.fiscal_code
                        }
                      ),
                    TE.mapLeft(errorsToError),
                    TE.chain(
                      TE.fromPredicate(
                        r => r.status === 200,
                        r =>
                          Error(
                            `Failed to fetch PN SentNotificationDocument: ${r.status}`
                          )
                      )
                    ),
                    TE.map(
                      response =>
                        response.value as NotificationAttachmentDownloadMetadataResponse
                    ),
                    TE.chainEitherK(metadata =>
                      pipe(
                        {
                          content_type: metadata.contentType,
                          id: `D${document.docIdx}`,
                          name: metadata.filename,
                          url: new URL(metadata.url ?? "").pathname
                        },
                        ThirdPartyAttachment.decode,
                        E.mapLeft(errorsToError)
                      )
                    )
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
    TE.mapLeft(error =>
      ProblemJson.encode({
        detail: error.message,
        status: 500,
        title: "Error fetching PN data"
      })
    ),
    TE.map(
      body =>
        new Response(JSON.stringify(body), { status: 200, statusText: "OK" })
    ),
    TE.mapLeft(
      error =>
        new Response(JSON.stringify(error), {
          status: error.status,
          statusText: error.title
        })
    ),
    TE.toUnion
  )();

export const pnFetch = (
  origFetch: typeof fetch = fetch,
  pnUrl: string,
  pnApiKey: string
): typeof fetch => (input: RequestInfo, init?: RequestInit) =>
  pipe(input, getUrl, url =>
    ThirdPartyMessagesUrl.is(url)
      ? redirectMessages(origFetch, pnUrl, pnApiKey, url, init)
      : () => {
          throw Error(
            `Can not find a Piattaforma Notifiche implementation for ${url}`
          );
        }
  )();
