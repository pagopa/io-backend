/**
 * This service retrieves messages from the API system using an API client.
 */

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseSuccessJson,
  ResponseErrorNotFound,
  ResponseErrorTooManyRequests,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import { fromNullable } from "fp-ts/lib/Option";
import { PaginatedPublicMessagesCollection } from "generated/io-api/PaginatedPublicMessagesCollection";
import { AppMessagesAPIClient } from "src/clients/app-messages.client";
import { GetMessagesParameters } from "../../generated/backend/GetMessagesParameters";

import { CreatedMessageWithContentAndAttachments } from "../../generated/backend/CreatedMessageWithContentAndAttachments";
import { getPrescriptionAttachments } from "../utils/attachments";
import { User } from "../types/user";
import {
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";

export default class NewMessagesService {
  constructor(
    private readonly apiClient: ReturnType<typeof AppMessagesAPIClient>
  ) {}

  /**
   * Retrieves all messages for a specific user.
   */
  public readonly getMessagesByUser = (
    user: User,
    params: GetMessagesParameters
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<PaginatedPublicMessagesCollection>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.getMessagesByUser({
        /* eslint-disable sort-keys */
        fiscal_code: user.fiscal_code,
        page_size: params.pageSize,
        enrich_result_data: params.enrichResultData,
        archived: params.getArchivedMessages,
        maximum_id: params.maximumId,
        minimum_id: params.minimumId
        /* eslint-enable sort-keys */
      });

      return withValidatedOrInternalError(validated, response =>
        response.status === 200
          ? ResponseSuccessJson(response.value)
          : response.status === 404
          ? ResponseErrorNotFound("Not found", "User not found")
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : unhandledResponseStatus(response.status)
      );
    });

  /**
   * Retrieves a specific message.
   */
  public readonly getMessage = (
    user: User,
    messageId: string
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<CreatedMessageWithContentAndAttachments>
  > =>
    withCatchAsInternalError(async () => {
      const res = await this.apiClient.getMessage({
        fiscal_code: user.fiscal_code,
        id: messageId
      });

      const resMessageContent = res.map(_ =>
        _.status === 200 ? { ..._, value: _.value.message } : _
      );

      return withValidatedOrInternalError(resMessageContent, async response => {
        if (response.status === 200) {
          const maybePrescriptionData = fromNullable(
            response.value.content.prescription_data
          );

          return maybePrescriptionData.isNone()
            ? ResponseSuccessJson(response.value)
            : getPrescriptionAttachments(maybePrescriptionData.value)
                .map(attachments => ({
                  ...response.value,
                  content: {
                    ...response.value.content,
                    attachments
                  }
                }))
                .map(ResponseSuccessJson)
                .run();
        }

        return response.status === 404
          ? ResponseErrorNotFound("Not found", "Message not found")
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : unhandledResponseStatus(response.status);
      });
    });
}
