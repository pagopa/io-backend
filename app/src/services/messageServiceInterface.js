// @flow

"use strict";

export interface MessageServiceInterface {
  /**
   * Retrieves the messages for the user identified by the fiscalCode.
   *
   * @param fiscalCode
   * @param res
   */
  getMessagesByUser(fiscalCode: string, res: express$Response): void;

  /**
   * Retrieves a single message identified by the messageId.
   *
   * @param fiscalCode
   * @param messageId
   * @param res
   */
  getUserMessage(
    fiscalCode: string,
    messageId: string,
    res: express$Response
  ): void;
}
