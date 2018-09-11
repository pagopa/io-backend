import { FiscalCode } from "../api/FiscalCode";
import { MessageBodyMarkdown } from "../api/MessageBodyMarkdown";
import { MessageContent } from "../api/MessageContent";
import {
  emailEnum,
  MessageResponseNotificationStatus
} from "../api/MessageResponseNotificationStatus";
import { MessageSubject } from "../api/MessageSubject";
import { MessageWithContent } from "../api/MessageWithContent";
import { MessageWithoutContent } from "../api/MessageWithoutContent";
import { CreatedMessageWithContent } from "../api_client/createdMessageWithContent";
import { CreatedMessageWithoutContent } from "../api_client/createdMessageWithoutContent";
import { MessageResponseWithContent } from "../api_client/messageResponseWithContent";
import {
  toAppMessageWithContent,
  toAppMessageWithoutContent
} from "../message";

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;
const aTimestamp = 1518010929530;

// mock for a valid CreatedMessageWithoutContent
const mockedCreatedMessageWithoutContent: CreatedMessageWithoutContent = {
  createdAt: new Date(aTimestamp),
  fiscalCode: aFiscalCode,
  id: "string" as string,
  senderServiceId: "string" as string,
  timeToLive: 123456 as number
};

// mock for a valid CreatedMessageWithContent
const aMessage: CreatedMessageWithContent = {
  content: {
    markdown: "message" as MessageBodyMarkdown,
    subject: "subject" as MessageSubject
  } as MessageContent,
  createdAt: new Date(),
  fiscalCode: aFiscalCode,
  id: "string",
  senderServiceId: "string",
  timeToLive: 12345
};
// mock for a valid NotificationStatus
const aNotification: MessageResponseNotificationStatus = {
  email: "QUEUED" as emailEnum
};
// mock for a valid MessageResponseWithContent
const mockedMessageResponseWithContent: MessageResponseWithContent = {
  message: aMessage,
  notification: aNotification
};

describe("message type", () => {
  // test case: Converts an API CreatedMessage to a Proxy message
  it("should get a proxy message without a content", async () => {
    // Converts an API CreatedMessage to a Proxy message
    const messageWithoutContent: MessageWithoutContent = toAppMessageWithoutContent(
      mockedCreatedMessageWithoutContent
    );

    expect(messageWithoutContent.id).toBe(
      mockedCreatedMessageWithoutContent.id
    );
    expect(messageWithoutContent.sender_service_id).toBe(
      mockedCreatedMessageWithoutContent.senderServiceId
    );
  });

  // test case: Converts an API MessageResponse to a Proxy message.
  it("should get a proxy message with a content", async () => {
    // Converts an API CreatedMessage to a Proxy message
    const messageWithContent: MessageWithContent = toAppMessageWithContent(
      mockedMessageResponseWithContent
    );

    // id = from.message.id || ""
    if (mockedMessageResponseWithContent.message.id === undefined) {
      expect(messageWithContent.id).toBe("");
      expect(messageWithContent.id).toBeDefined();
    } else {
      expect(messageWithContent.id).toBe(
        mockedMessageResponseWithContent.message.id
      );
      expect(messageWithContent.id).toBeDefined();
    }

    // created_at
    expect(messageWithContent.created_at).toBe(
      mockedMessageResponseWithContent.message.createdAt
    );

    // markdown: from.message.content !== undefined ? from.message.content.markdown : "",
    if (mockedMessageResponseWithContent.message.content === undefined) {
      expect(messageWithContent.content.markdown).toBe("");
      expect(messageWithContent.content.markdown).toBeDefined();
    } else {
      expect(messageWithContent.content.markdown).toBe(
        mockedMessageResponseWithContent.message.content.markdown
      );
      expect(messageWithContent.content.markdown).toBeDefined();
    }

    // markdown: sender_service_id: from.message.senderServiceId,
    expect(messageWithContent.sender_service_id).toBe(
      mockedMessageResponseWithContent.message.senderServiceId
    );

    // subject: from.message.content !== undefined ? from.message.content.subject : ""
    if (mockedMessageResponseWithContent.message.content === undefined) {
      expect(messageWithContent.content.subject).toBe("");
      expect(messageWithContent.content.subject).toBeDefined();
    } else {
      expect(messageWithContent.content.subject).toBe(
        mockedMessageResponseWithContent.message.content.subject
      );
      expect(messageWithContent.content.subject).toBeDefined();
    }
  });
});
