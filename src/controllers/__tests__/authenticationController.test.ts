import * as E from "fp-ts/lib/Either";
import { UserIdentity } from "../../../generated/auth/UserIdentity";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { mockedUser } from "../../__mocks__/user_mock";
import { exactUserIdentityDecode } from "../../types/user";
import { getUserIdentity } from "../authenticationController";

describe("AuthenticationController#getUserIdentity", () => {
  let mockUserDecode: jest.SpyInstance | undefined;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterEach(() => {
    if (mockUserDecode !== undefined) {
      mockUserDecode.mockRestore();
    }
  });

  it("shoud return a success response with the User Identity", async () => {
    const res = mockRes();
    const req = mockReq({ user: mockedUser });

    const response = await getUserIdentity(req);
    response.apply(res);

    const expectedValue = exactUserIdentityDecode(
      mockedUser as unknown as UserIdentity
    );
    expect(E.isRight(expectedValue)).toBeTruthy();
    if (E.isRight(expectedValue)) {
      expect(response).toEqual({
        apply: expect.any(Function),
        kind: "IResponseSuccessJson",
        value: expectedValue.right,
      });
    }
  });

  it("should fail if the User object doesn't match UserIdentity decoder contraints", async () => {
    const res = mockRes();
    const req = mockReq({
      user: { ...mockedUser, fiscal_code: "INVALID_FISCALCODE" },
    });

    // Emulate a successfully User decode and a failure on UserIdentity decode
    const user = require("../../types/user").User;
    mockUserDecode = jest
      .spyOn(user, "decode")
      .mockImplementation((_: unknown) => E.right(_));

    const response = await getUserIdentity(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: "Internal server error: Unexpected User Identity data format.",
      kind: "IResponseErrorInternal",
    });
  });
});
