import { MyPortalUser } from "../../../generated/myportal/MyPortalUser";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { getUserForMyPortal } from "../ssoController";
import { mockedUser } from "../../__mocks__/user_mock";

const myPortalUserResponse: MyPortalUser = {
  family_name: mockedUser.family_name,
  fiscal_code: mockedUser.fiscal_code,
  name: mockedUser.name,
};
const req = mockReq();
const res = mockRes();

const mockGetProfile = jest.fn();
jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getProfile: mockGetProfile,
    })),
  };
});

describe("SSOController#getUserForMyPortal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("calls the getUserForMyPortal on the SSOController with valid values", async () => {
    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const response = await getUserForMyPortal(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: myPortalUserResponse,
    });
    response.apply(res);
    expect(res.json).toBeCalledWith(myPortalUserResponse);
  });

  it("calls the getUserForMyPortal on the SSOController with invalid user session", async () => {
    // An invalid user session data where the user name is missing
    const invalidUserSession = {
      ...mockedUser,
      name: undefined,
    };

    // tslint:disable-next-line: no-object-mutation
    req.user = invalidUserSession;

    const response = await getUserForMyPortal(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: expect.any(String),
      kind: "IResponseErrorValidation",
    });
    response.apply(res);
    expect(res.status).toBeCalledWith(400);
  });
});
