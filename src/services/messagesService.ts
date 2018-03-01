/**
 * This service retrieves messages from the API system using an API client.
 */

import { isLeft } from "fp-ts/lib/Either";
import { ProblemJson } from "../types/api/ProblemJson";
import { GetMessagesByUserOKResponse } from "../types/api_client/getMessagesByUserOKResponse";
import { MessageResponseWithContent } from "../types/api_client/messageResponseWithContent";
import { ServicePublic } from "../types/api_client/servicePublic";
import {
  Message,
  Messages,
  toAppMessageWithContent,
  toAppMessageWithoutContent
} from "../types/message";
import { Service, toAppService } from "../types/service";
import { User } from "../types/user";
import { IApiClientFactoryInterface } from "./iApiClientFactory";

export default class MessagesService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves all messages for a specific user.
   */
  public getMessagesByUser(user: User): Promise<Messages> {
    return new Promise(async (resolve, reject) => {
      const messagesPayload = await this.apiClient
        .getClient(user.fiscal_code)
        .getMessagesByUser();

      const errorOrApiMessages = GetMessagesByUserOKResponse.decode(
        messagesPayload
      );
      if (isLeft(errorOrApiMessages)) {
        const errorOrProblemJson = ProblemJson.decode(messagesPayload);

        if (isLeft(errorOrProblemJson)) {
          return reject(new Error("Unknown response."));
        }

        return reject(new Error("Api error."));
      }

      const apiMessages = errorOrApiMessages.value;

      if (apiMessages.items === undefined) {
        return resolve({});
      }

      const appMessages = apiMessages.items.map(toAppMessageWithoutContent);
      return resolve({
        items: appMessages,
        pageSize: apiMessages.pageSize
      });
    });
  }

  /**
   * Retrieves a specific message.
   */
  public getMessage(user: User, messageId: string): Promise<Message> {
    return new Promise(async (resolve, reject) => {
      const messagePayload = await this.apiClient
        .getClient(user.fiscal_code)
        .getMessage(messageId);

      const errorOrApiMessage = MessageResponseWithContent.decode(
        messagePayload
      );
      if (isLeft(errorOrApiMessage)) {
        const errorOrProblemJson = ProblemJson.decode(messagePayload);

        if (isLeft(errorOrProblemJson)) {
          return reject(new Error("Unknown response."));
        }

        return reject(new Error("Api error."));
      }

      const apiMessage = errorOrApiMessage.value;
      return resolve(toAppMessageWithContent(apiMessage));
    });
  }

  /**
   * Retrieve all the information about the service that has sent a message.
   */
  public getService(user: User, serviceId: string): Promise<Service> {
    return new Promise(async (resolve, reject) => {
      const servicePayload = await this.apiClient
        .getClient(user.fiscal_code)
        .getService(serviceId);

      const errorOrApiService = ServicePublic.decode(servicePayload);
      if (isLeft(errorOrApiService)) {
        const errorOrProblemJson = ProblemJson.decode(servicePayload);

        if (isLeft(errorOrProblemJson)) {
          return reject(new Error("Unknown response."));
        }

        return reject(new Error("Api error."));
      }

      const apiService = errorOrApiService.value;
      return resolve(toAppService(apiService));
    });
  }
}
