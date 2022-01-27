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
    /**
     * This method is used in substitution of generated one, due to a wrong management of
     * octet stream responses in auto-generated code.
     *
     * @param legalMessageId: The MVL unique identifier on PEC's provider platform
     * @param attachmentId: The MVL attacchment's unique identifier on PEC's provider platform
     * @returns Either a Buffer for the retrieved attachment or an error
     */
    getAttachmentBody: (legalMessageId: string, attachmentId: string) =>
      TE.tryCatch(
        () =>
          fetchApi(
            `${baseUrl}${basePath}/messages/${legalMessageId}/attachments/${attachmentId}`
          ),
        E.toError
      )
        .mapLeft(
          fetchError =>
            new Error(
              `Failed to perform fetch call for MVL attachment|ERROR=${fetchError.message}`
            )
        )
        .chain(
          TE.fromPredicate(
            r => r.status === 200,
            r => new Error(`Failed to fetch MVL attachment: ${r.status}`)
          )
        )
        .chain<Buffer>(rawResponse =>
          TE.tryCatch(() => rawResponse.arrayBuffer(), E.toError).bimap(
            bufferError =>
              new Error(
                `Failed to parse MVL attachment's buffer|ERROR=${bufferError.message}`
              ),
            Buffer.from
          )
        )
  }
});
export type IPecServerClient = typeof pecServerClient;
