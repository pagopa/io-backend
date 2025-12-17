import mockReq from "../../../__mocks__/request";
import mockRes from "../../../__mocks__/response";
import { getApiKeyAuthMiddleware, xUserMiddleware } from "../session";
import { mockedUserIdentity } from "../../../__mocks__/user_mock";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

describe("UserSessionAuthMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validToken = Buffer.from(JSON.stringify(mockedUserIdentity)).toString(
    "base64"
  );

  const validMockRequest = mockReq({
    headers: {
      "x-user": validToken
    },
    user: undefined
  });
  const mockResponse = mockRes();
  const mockNext = jest.fn().mockImplementation(() => {});

  it("should succeed on user parsing", () => {
    xUserMiddleware(validMockRequest, mockResponse, mockNext);

    expect(validMockRequest.user).toEqual(mockedUserIdentity);
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.send).not.toHaveBeenCalled();
  });

  it("should fail with 401 on missing header", () => {
    const mockRequest = mockReq();
    xUserMiddleware(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.send).toHaveBeenCalledTimes(1);
  });

  it.each`
    scenario                      | value
    ${"wrong base64"}             | ${"=="}
    ${"header with empty string"} | ${""}
    ${"wrong payload"}            | ${Buffer.from(JSON.stringify({ foo: "bar" })).toString("base64")}
  `("should fail with 401 on $scenario", ({ value }) => {
    const mockRequest = mockReq({
      headers: { "x-user": value },
      user: undefined
    });
    xUserMiddleware(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.send).toHaveBeenCalledTimes(1);
  });
});

describe("GetApiKeyAuthMiddleware ", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const validApiKey = "foo" as NonEmptyString;

  const validMockRequest = mockReq({
    headers: {
      "x-api-key-example": validApiKey
    }
  });
  const mockResponse = mockRes();
  const mockNext = jest.fn().mockImplementation(() => {});

  it("should succeed on correct primary api key", () => {
    getApiKeyAuthMiddleware("x-api-key-example" as NonEmptyString, validApiKey)(
      validMockRequest,
      mockResponse,
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
  });

  it("should succeed on correct secondary api key", () => {
    const secondaryApiKey = "bar" as NonEmptyString;
    getApiKeyAuthMiddleware(
      "x-api-key-example" as NonEmptyString,
      validApiKey,
      secondaryApiKey
    )(
      mockReq({
        headers: {
          "x-api-key-example": secondaryApiKey
        }
      }),
      mockResponse,
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
  });

  it("should fail with 401 on missing header", () => {
    const mockRequest = mockReq();
    getApiKeyAuthMiddleware("x-api-key-example" as NonEmptyString, validApiKey)(
      mockRequest,
      mockResponse,
      mockNext
    );

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.send).toHaveBeenCalledTimes(1);
  });

  it.each`
    scenario                      | hasSecondaryKey | value
    ${"wrong key"}                | ${true}         | ${"Wrong"}
    ${"wrong key"}                | ${false}        | ${"Wrong"}
    ${"header with empty string"} | ${true}         | ${""}
    ${"header with empty string"} | ${false}        | ${""}
    ${"null key"}                 | ${true}         | ${null}
    ${"null key"}                 | ${false}        | ${null}
  `("should fail with 401 on $scenario", ({ value, hasSecondaryKey }) => {
    const secondaryApiKey = "bar" as NonEmptyString;
    const mockRequest = mockReq({
      headers: {
        "x-api-key-example": value
      }
    });
    getApiKeyAuthMiddleware(
      "x-api-key-example" as NonEmptyString,
      validApiKey,
      hasSecondaryKey ? secondaryApiKey : undefined
    )(mockRequest, mockResponse, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.send).toHaveBeenCalledTimes(1);
  });
});
