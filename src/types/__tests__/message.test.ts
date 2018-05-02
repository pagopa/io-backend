import { FiscalCode } from "../api/FiscalCode";
import { MessageBodyMarkdown } from "../api/MessageBodyMarkdown";
import { MessageContent } from "../api/MessageContent";
import { MessageSubject } from "../api/MessageSubject";
import { NotificationChannelStatus } from "../api/NotificationChannelStatus";
import { NotificationStatus } from "../api/NotificationStatus";
import { CreatedMessageWithContent } from "../api_client/createdMessageWithContent";
import { CreatedMessageWithoutContent } from "../api_client/createdMessageWithoutContent";
import { MessageResponseWithContent } from "../api_client/messageResponseWithContent";
import {
  Message,
  toAppMessageWithContent,
  toAppMessageWithoutContent
} from "../message";

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;

// mock for a valid CreatedMessageWithoutContent
const mockedCreatedMessageWithoutContent: CreatedMessageWithoutContent = {
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
  fiscalCode: aFiscalCode,
  id: "string",
  senderServiceId: "string",
  timeToLive: 12345
};
// mock for a valid NotificationStatus
const aNotification: NotificationStatus = {
  email: "QUEUED" as NotificationChannelStatus
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
    const messageWithoutContent: Message = toAppMessageWithoutContent(
      mockedCreatedMessageWithoutContent
    );

    expect(messageWithoutContent.id).toBe(
      mockedCreatedMessageWithoutContent.id
    );
    expect(messageWithoutContent.sender_service_id).toBe(
      mockedCreatedMessageWithoutContent.senderServiceId
    );
    expect(messageWithoutContent.markdown).toBeUndefined();
    expect(messageWithoutContent.subject).toBeUndefined();
  });

  // test case: Converts an API MessageResponse to a Proxy message.
  it("should get a proxy message with a content", async () => {
    // Converts an API CreatedMessage to a Proxy message
    const messageWithContent: Message = toAppMessageWithContent(
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

    // markdown: from.message.content !== undefined ? from.message.content.markdown : "",
    if (mockedMessageResponseWithContent.message.content === undefined) {
      expect(messageWithContent.markdown).toBe("");
      expect(messageWithContent.markdown).toBeDefined();
    } else {
      expect(messageWithContent.markdown).toBe(
        mockedMessageResponseWithContent.message.content.markdown
      );
      expect(messageWithContent.markdown).toBeDefined();
    }

    // markdown: sender_service_id: from.message.senderServiceId,
    expect(messageWithContent.sender_service_id).toBe(
      mockedMessageResponseWithContent.message.senderServiceId
    );

    // subject: from.message.content !== undefined ? from.message.content.subject : ""
    if (mockedMessageResponseWithContent.message.content === undefined) {
      expect(messageWithContent.subject).toBe("");
      expect(messageWithContent.subject).toBeDefined();
    } else {
      expect(messageWithContent.subject).toBe(
        mockedMessageResponseWithContent.message.content.subject
      );
      expect(messageWithContent.subject).toBeDefined();
    }
  });
});
