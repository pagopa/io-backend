import { left, right } from "fp-ts/lib/Either";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import RedisSessionStorage from "../../services/redisSessionStorage";
import RedisUserMetadataStorage from "../../services/redisUserMetadataStorage";
import SessionLockController from "../sessionLockController";

const aFiscalCode = FiscalCode.decode("AAABBB80A01C123D").getOrElseL(() => {
  throw new Error("invalid mock FiscalCode");
});

const mockDelUserAllSessions = jest
  .fn()
  .mockImplementation(async () => right(true));
const mockSetBlockedUser = jest
  .fn()
  .mockImplementation(async () => right(true));
const mockUnsetBlockedUser = jest
  .fn()
  .mockImplementation(async () => right(true));
const mockRedisSessionStorage = ({
  delUserAllSessions: mockDelUserAllSessions,
  setBlockedUser: mockSetBlockedUser,
  unsetBlockedUser: mockUnsetBlockedUser
} as unknown) as RedisSessionStorage;

const mockDel = jest.fn().mockImplementation(async () => right(true));
const mockRedisUserMetadataStorage = ({
  del: mockDel
} as unknown) as RedisUserMetadataStorage;

describe("SessionLockController#lockUserSession", () => {
  it("should fail on invalid fiscal code", async () => {
    const req = mockReq({ params: { fiscal_code: "invalid" } });
    const res = mockRes();

    const controller = new SessionLockController(
      mockRedisSessionStorage,
      mockRedisUserMetadataStorage
    );

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should fail on invalid request", async () => {
    const req = mockReq({ params: { invalid: true } });
    const res = mockRes();

    const controller = new SessionLockController(
      mockRedisSessionStorage,
      mockRedisUserMetadataStorage
    );

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should succeed on correct request", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    const controller = new SessionLockController(
      mockRedisSessionStorage,
      mockRedisUserMetadataStorage
    );

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "ok"
    });
  });

  it("should fail on lock error", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockSetBlockedUser.mockImplementationOnce(async () => left("any error"));

    const controller = new SessionLockController(
      mockRedisSessionStorage,
      mockRedisUserMetadataStorage
    );

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should fail on delete session error", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockDelUserAllSessions.mockImplementationOnce(async () =>
      left("any error")
    );

    const controller = new SessionLockController(
      mockRedisSessionStorage,
      mockRedisUserMetadataStorage
    );

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should fail on delete metadata error", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockDel.mockImplementationOnce(async () => left("any error"));

    const controller = new SessionLockController(
      mockRedisSessionStorage,
      mockRedisUserMetadataStorage
    );

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("SessionLockController#unlockUserSession", () => {
  it("should fail on invalid fiscal code", async () => {
    const req = mockReq({ params: { fiscal_code: "invalid" } });
    const res = mockRes();

    const controller = new SessionLockController(
      mockRedisSessionStorage,
      mockRedisUserMetadataStorage
    );

    const response = await controller.unlockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should fail on invalid request", async () => {
    const req = mockReq({ params: { invalid: true } });
    const res = mockRes();

    const controller = new SessionLockController(
      mockRedisSessionStorage,
      mockRedisUserMetadataStorage
    );

    const response = await controller.unlockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should succeed on correct request", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    const controller = new SessionLockController(
      mockRedisSessionStorage,
      mockRedisUserMetadataStorage
    );

    const response = await controller.unlockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "ok"
    });
  });

  it("should fail on unlock error", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockUnsetBlockedUser.mockImplementationOnce(async () => left("any error"));

    const controller = new SessionLockController(
      mockRedisSessionStorage,
      mockRedisUserMetadataStorage
    );

    const response = await controller.unlockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
