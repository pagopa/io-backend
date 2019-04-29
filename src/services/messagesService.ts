/**
 * This service retrieves messages from the API system using an API client.
 */

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { CreatedMessageWithContent } from "@generated/io-api/CreatedMessageWithContent";
import { PaginatedCreatedMessageWithoutContentCollection } from "@generated/io-api/PaginatedCreatedMessageWithoutContentCollection";
import { PaginatedServiceTupleCollection } from "@generated/io-api/PaginatedServiceTupleCollection";
import { ServicePublic } from "@generated/io-api/ServicePublic";

import { parseResponse, withCatchAsInternalError } from "src/utils/responses";
import { User } from "../types/user";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

export default class MessagesService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves all messages for a specific user.
   */
  public getMessagesByUser(
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaginatedCreatedMessageWithoutContentCollection>
  > {
    return withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();
      const res = await client.getMessages({
        fiscalCode: user.fiscal_code
      });

      return parseResponse<PaginatedCreatedMessageWithoutContentCollection>(
        res
      );
    });
  }

  /**
   * Retrieves a specific message.
   */
  public async getMessage(
    user: User,
    messageId: string
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<CreatedMessageWithContent>
  > {
    return withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const res = await client.getMessage({
        fiscalCode: user.fiscal_code,
        id: messageId
      });

      const resMessageContent = res.map(
        _ => (_.status === 200 ? { ..._, value: _.value.message } : _)
      );

      return parseResponse<CreatedMessageWithContent>(resMessageContent);
    });
  }

  /**
   * Retrieve all the information about the service that has sent a message.
   */
  public async getService(
    serviceId: string
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<ServicePublic>
  > {
    return withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const res = await client.getService({
        service_id: serviceId
      });

      return parseResponse<ServicePublic>(res);
    });
  }

  public async getServicesByRecipient(
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaginatedServiceTupleCollection>
  > {
    return withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const res = await client.getServicesByRecipient({
        recipient: user.fiscal_code
      });

      return parseResponse<PaginatedServiceTupleCollection>(res);
    });
  }

  public async getVisibleServices(): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaginatedServiceTupleCollection>
  > {
    return withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const res = await client.getVisibleServices({});

      return parseResponse<PaginatedServiceTupleCollection>(res);
    });
  }
}
