/**
 *
 */

import { isLeft } from "fp-ts/lib/Either";
import * as winston from "winston";
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

  public async getMessagesByUser(user: User): Promise<Messages> {
    try {
      const messagesPayload = await this.apiClient
        .getClient(user.fiscal_code)
        .getMessagesByUser();

      const maybeApiMessages = GetMessagesByUserOKResponse.decode(
        messagesPayload
      );
      if (isLeft(maybeApiMessages)) {
        const maybeProblemJson = ProblemJson.decode(messagesPayload);

        if (isLeft(maybeProblemJson)) {
          return Promise.reject(new Error("Unknown response."));
        }

        return Promise.reject(new Error("Api error."));
      }

      const apiMessages = maybeApiMessages.value;

      if (apiMessages.items === undefined) {
        return Promise.resolve({});
      }

      const appMessages = apiMessages.items.map(toAppMessageWithoutContent);
      return Promise.resolve({
        items: appMessages,
        pageSize: apiMessages.pageSize
      });
    } catch (err) {
      winston.log("error", "Error occurred in API call: %s", err.message);
      return Promise.reject(new Error("Error in calling the API."));
    }
  }

  public async getMessage(user: User, messageId: string): Promise<Message> {
    try {
      const messagePayload = await this.apiClient
        .getClient(user.fiscal_code)
        .getMessage(messageId);

      const maybeApiMessage = MessageResponseWithContent.decode(messagePayload);
      if (isLeft(maybeApiMessage)) {
        const maybeProblemJson = ProblemJson.decode(messagePayload);

        if (isLeft(maybeProblemJson)) {
          return Promise.reject(new Error("Unknown response."));
        }

        return Promise.reject(new Error("Api error."));
      }

      const apiMessage = maybeApiMessage.value;
      return Promise.resolve(toAppMessageWithContent(apiMessage));
    } catch (err) {
      winston.log("error", "Error occurred in API call: %s", err.message);
      return Promise.reject(new Error("Error in calling the API."));
    }
  }

  public async getService(user: User, serviceId: string): Promise<Service> {
    try {
      const servicePayload = await this.apiClient
        .getClient(user.fiscal_code)
        .getService(serviceId);

      const maybeApiService = ServicePublic.decode(servicePayload);
      if (isLeft(maybeApiService)) {
        const maybeProblemJson = ProblemJson.decode(servicePayload);

        if (isLeft(maybeProblemJson)) {
          return Promise.reject(new Error("Unknown response."));
        }

        return Promise.reject(new Error("Api error."));
      }

      const apiService = maybeApiService.value;
      return Promise.resolve(toAppService(apiService));
    } catch (err) {
      winston.log("error", "Error occurred in API call: %s", err.message);
      return Promise.reject(new Error("Error in calling the API."));
    }
  }
}
