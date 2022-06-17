import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { MessagesFeatureFlagType } from "../config";
import MessagesService from "./messagesService";
import NewMessagesService from "./newMessagesService";

/**
 *
 * @param regex The regex to use
 * @returns
 */
export const getIsUserACanaryTestUser = (
  regex: string
): ((sha: NonEmptyString) => boolean) => {
  const regExp = new RegExp(regex);

  return (sha: NonEmptyString): boolean => regExp.test(sha);
};

export type MessageServiceSelector = ReturnType<
  typeof getMessagesServiceSelector
>;

//
export const getMessagesServiceSelector = (
  oldMessagesService: MessagesService,
  newMessageService: NewMessagesService,
  _ffType: MessagesFeatureFlagType,
  _betaTesterUsers: ReadonlyArray<NonEmptyString>,
  _canaryTestUserRegex: NonEmptyString
) => ({
  getNewMessageService: () => newMessageService,
  getOldMessageService: () => oldMessagesService
});
