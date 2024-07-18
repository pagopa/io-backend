import { QueueClient, QueueSendMessageResponse } from "@azure/storage-queue";
import { RevokeAssertionRefInfo } from "@pagopa/io-functions-commons/dist/src/entities/revoke_assertion_ref_info";
import { AssertionRef } from "../../generated/lollipop-api/AssertionRef";
import { base64EncodeObject } from "../utils/messages";

export default class LollipopService {
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

  /**
   * Send a message into the Queue to schedule the pub key revoke process
   * on fn-lollipop.
   *
   * @param assertionRef the pub key identifier
   */
  public revokePreviousAssertionRef(
    assertionRef: AssertionRef
  ): Promise<QueueSendMessageResponse> {
    const revokeMessage = RevokeAssertionRefInfo.encode({
      assertion_ref: assertionRef,
    });
    return this.queueClient.sendMessage(base64EncodeObject(revokeMessage));
  }
}
