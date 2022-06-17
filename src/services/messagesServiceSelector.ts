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
  // eslint-disable-next-line arrow-body-style
) => {
  // const isCanaryTestUser = getIsUserACanaryTestUser(canaryTestUserRegex);
  return {
    getNewMessageService: () => newMessageService,
    getOldMessageService: () => oldMessagesService
    // select: (fiscalCode: FiscalCode) => {
    //   switch (ffType) {
    //     case "none":
    //       return oldMessagesService;
    //     case "beta":
    //       return betaTesterUsers.includes(toFiscalCodeHash(fiscalCode))
    //         ? newMessageService
    //         : oldMessagesService;
    //     case "canary":
    //       return isCanaryTestUser(toFiscalCodeHash(fiscalCode)) ||
    //         betaTesterUsers.includes(toFiscalCodeHash(fiscalCode))
    //         ? newMessageService
    //         : oldMessagesService;
    //     case "prod":
    //       return newMessageService;
    //     default:
    //       // This will never happen
    //       return oldMessagesService;
    //   }
    // }
  };
};
