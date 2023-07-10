import * as t from "io-ts";

import * as TE from "fp-ts/TaskEither";

import { QueueClient, QueueSendMessageResponse } from "@azure/storage-queue";

import { UTCISODateFromString } from "@pagopa/ts-commons/lib/dates";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { OnUserLogin } from "../controllers/authenticationController";

import { base64EncodeObject } from "../utils/messages";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

export const UserLogin = t.interface({
  fiscalCode: FiscalCode,
  lastLoginAt: UTCISODateFromString,
  source: t.keyof({
    cie: null,
    spid: null,
  }),
});

export type UserLogin = t.TypeOf<typeof UserLogin>;

export default class UsersLoginLogService {
  private readonly queueClient: QueueClient;

  constructor(
    private readonly queueStorageConnectionString: string,
    private readonly queueName: string
  ) {
    this.queueClient = new QueueClient(
      this.queueStorageConnectionString,
      this.queueName
    );
  }

  public readonly logUserLogin = (
    userLogin: UserLogin
  ): Promise<QueueSendMessageResponse> => {
    const userLoginEncoded = UserLogin.encode(userLogin);

    return this.queueClient.sendMessage(base64EncodeObject(userLoginEncoded));
  };
}

export const onUserLogin: (
  apiClientFactory: IApiClientFactoryInterface
  // eslint-disable-next-line arrow-body-style
) => OnUserLogin = (_apiClientFactory) => {
  // const client = apiClientFactory.getClient();

  return (_data) =>
    // TODO: Call notify-login
    TE.of<Error, true>(true);
};
