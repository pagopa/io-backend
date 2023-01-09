import NotificationService from "../notificationService";
import { getNotificationServiceFactory } from "../notificationServiceFactory";

import { FeatureFlagEnum } from "../../utils/featureFlag";

import { aFiscalCode } from "../../__mocks__/user_mock";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

// --------------------------------------------
// Mocks
// --------------------------------------------
const mockSendMessage = jest.fn();
jest.mock("@azure/storage-queue", () => ({
  QueueClient: jest.fn().mockImplementation((_, __) => {
    return {
      sendMessage: mockSendMessage
    };
  })
}));

const oldNotificationService = new NotificationService("OLD", "OLD");
const newNotificationService = new NotificationService("NEW", "NEW");

const aCanaryShaRegex = "^([(0-9)|(a-f)|(A-F)]{63}0)$" as NonEmptyString;

// --------------------------------------------
// Tests
// --------------------------------------------
describe("notificationServiceFactory#getNotificationService returning old Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return old notification service if ff is BETA and user is not a beta tester", async () => {
    const getService = getNotificationServiceFactory(
      oldNotificationService,
      newNotificationService,
      [],
      aCanaryShaRegex,
      FeatureFlagEnum.BETA
    );

    const result = getService(aFiscalCode);

    expect(result).not.toEqual(newNotificationService);
    expect(result).toEqual(oldNotificationService);
  });

  it("should return old notification service if ff is CANARY and user is not a beta tester neither he bolongs to canary set", async () => {
    const getService = getNotificationServiceFactory(
      oldNotificationService,
      newNotificationService,
      [],
      aCanaryShaRegex,
      FeatureFlagEnum.CANARY
    );

    const result = getService(aFiscalCode);

    expect(result).not.toEqual(newNotificationService);
    expect(result).toEqual(oldNotificationService);
  });
});

describe("notificationServiceFactory#getNotificationService returning new Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return new notification service if ff is BETA and user is a beta tester", async () => {
    const getService = getNotificationServiceFactory(
      oldNotificationService,
      newNotificationService,
      [aFiscalCode],
      aCanaryShaRegex,
      FeatureFlagEnum.BETA
    );

    const result = getService(aFiscalCode);

    expect(result).toEqual(newNotificationService);
    expect(result).not.toEqual(oldNotificationService);
  });

  it("should return new notification service if ff is CANARY and user is a beta tester", async () => {
    const getService = getNotificationServiceFactory(
      oldNotificationService,
      newNotificationService,
      [aFiscalCode],
      aCanaryShaRegex,
      FeatureFlagEnum.CANARY
    );

    const result = getService(aFiscalCode);

    expect(result).toEqual(newNotificationService);
    expect(result).not.toEqual(oldNotificationService);
  });

  it("should return new notification service if ff is CANARY and user belongs to canary set", async () => {
    const getService = getNotificationServiceFactory(
      oldNotificationService,
      newNotificationService,
      [],
      // Hashed Fiscal Code is: d3f70202fd4d5bd995d6fe996337c1b77b0a4a631203048dafba121d2715ea52
      // So we use a regex expecting "2" as last char
      "^([(0-9)|(a-f)|(A-F)]{63}2)$" as NonEmptyString,
      FeatureFlagEnum.CANARY
    );

    const result = getService(aFiscalCode);

    expect(result).toEqual(newNotificationService);
    expect(result).not.toEqual(oldNotificationService);
  });
});
