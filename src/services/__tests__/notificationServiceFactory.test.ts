import NotificationService from "../notificationService";
import { getNotificationServiceFactory } from "../notificationServiceFactory";

import { FeatureFlagEnum } from "../../utils/featureFlag";

import { aFiscalCode } from "../../__mocks__/user_mock";

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

// --------------------------------------------
// Tests
// --------------------------------------------
describe("notificationServiceFactory#getNotificationService returning old Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return new notification service if ff is BETA and user is a beta tester", async () => {
    const getService = getNotificationServiceFactory(
      oldNotificationService,
      newNotificationService,
      [aFiscalCode],
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
      FeatureFlagEnum.CANARY
    );

    const result = getService(aFiscalCode);

    expect(result).toEqual(newNotificationService);
    expect(result).not.toEqual(oldNotificationService);
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
      FeatureFlagEnum.CANARY
    );

    const result = getService(aFiscalCode);

    expect(result).toEqual(newNotificationService);
    expect(result).not.toEqual(oldNotificationService);
  });
});
