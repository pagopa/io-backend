import * as t from "io-ts";

import { QueueClient, QueueSendMessageResponse } from "@azure/storage-queue";

import { UTCISODateFromString } from "italia-ts-commons/lib/dates";
import { FiscalCode } from "italia-ts-commons/lib/strings";

export const UserLogin = t.interface({
  fiscalCode: FiscalCode,
  lastLoginAt: UTCISODateFromString,
  source: t.keyof({
    cie: null,
    spid: null
  })
});

export type UserLogin = t.TypeOf<typeof UserLogin>;

export default class UsersLoginNotificationService {
  private queueClient: QueueClient;

  constructor(
    private readonly queueStorageConnectionString: string,
    private readonly queueName: string
  ) {
    this.queueClient = new QueueClient(
      this.queueStorageConnectionString,
      this.queueName
    );
  }

  public readonly notifyUserLogin = (
    userLogin: UserLogin
  ): Promise<QueueSendMessageResponse> => {
    const userLoginEncoded = UserLogin.encode(userLogin);

    return this.queueClient.sendMessage(JSON.stringify(userLoginEncoded));
  };
}
