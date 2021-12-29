/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */

import { fromLeft, taskEither } from "fp-ts/lib/TaskEither";
import mockReq from "../../__mocks__/request";
import TokenService from "../../services/tokenService";
import { mockedUser } from "../../__mocks__/user_mock";
import SupportController from "../supportController";

const mockGetSupportToken = jest.fn();
jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getJwtSupportToken: mockGetSupportToken
    }))
  };
});

const aSupportToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJJU1NVRVIiLCJmaXNjYWxDb2RlIjoiQUFBQUFBODVBMjBBNTAxQSIsImlhdCI6MTUxNjIzOTAyMn0.JjuBKb2TEzyhofs_LwwRYwmPJ_ROKUDa_sK1frDTkvc";

describe("SupportController#getSupportToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a valid support token by calling TokenService with valid values", async () => {
    const req = mockReq();

    mockGetSupportToken.mockReturnValue(taskEither.of(aSupportToken));

    req.user = mockedUser;

    const tokenService = new TokenService();
    const controller = new SupportController(tokenService);

    const response = await controller.getSupportToken(req);

    expect(response.kind).toEqual("IResponseSuccessJson");
    if (response.kind === "IResponseSuccessJson") {
      expect(response.value.access_token).toEqual(aSupportToken);
    }
  });

  it("should return an error if JWT Token generation fails", async () => {
    const req = mockReq();

    mockGetSupportToken.mockReturnValue(
      fromLeft(new Error("ERROR while generating JWT support token"))
    );
    req.user = mockedUser;

    const tokenService = new TokenService();
    const controller = new SupportController(tokenService);

    const response = await controller.getSupportToken(req);

    // getUserDataProcessing is not called
    expect(response.kind).toEqual("IResponseErrorInternal");
    if (response.kind === "IResponseErrorInternal") {
      expect(response.detail).toEqual(
        "Internal server error: ERROR while generating JWT support token"
      );
    }
  });
});
