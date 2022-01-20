import nodeFetch from "node-fetch";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as pecClient from "../../generated/pecserver/client";

export const pecServerClient = (
  baseUrl: string,
  basePath: string,
  fetchApi: typeof fetch = (nodeFetch as unknown) as typeof fetch // TODO: customize fetch with timeout
): pecClient.Client & {
  readonly getAttachmentBody: (
    legalMessageId: string,
    attachmentId: string
  ) => TE.TaskEither<Error, Buffer>;
} => ({
  ...pecClient.createClient({
    basePath,
    baseUrl,
    fetchApi
  }),
  ...{
    getAttachmentBody: (legalMessageId: string, attachmentId: string) =>
      TE.tryCatch(
        () =>
          fetchApi(
            `${baseUrl}${basePath}/messages/${legalMessageId}/attachments/${attachmentId}`
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
          TE.tryCatch(() => rawResponse.arrayBuffer(), E.toError).map(
            Buffer.from
          )
        )
  }
});
export type IPecServerClient = typeof pecServerClient;
