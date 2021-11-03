import { BPDUser } from "../../../generated/bpd/BPDUser";
import { MyPortalUser } from "../../../generated/myportal/MyPortalUser";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { getUserForBPD, getUserForMyPortal } from "../ssoController";
import { aMockedUser as mockedUser } from "../../__mocks__/user_mock";

const myPortalUserResponse: MyPortalUser = {
  family_name: mockedUser.family_name,
  fiscal_code: mockedUser.fiscal_code,
  name: mockedUser.name
};

const bpdUserResponse: BPDUser = {
  family_name: mockedUser.family_name,
  fiscal_code: mockedUser.fiscal_code,
  name: mockedUser.name
};

describe("SSOController#getUserForMyPortal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("calls the getUserForMyPortal on the SSOController with valid values", async () => {
    const req = mockReq();
    const res = mockRes();

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const response = await getUserForMyPortal(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: myPortalUserResponse
    });
    response.apply(res);
    expect(res.json).toBeCalledWith(myPortalUserResponse);
  });

  it("calls the getUserForMyPortal on the SSOController with invalid user session", async () => {
    const req = mockReq();
    const res = mockRes();

    // An invalid user session data where the user name is missing
    const invalidUserSession = {
      ...mockedUser,
      name: undefined
    };

    // tslint:disable-next-line: no-object-mutation
    req.user = invalidUserSession;

    const response = await getUserForMyPortal(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: expect.any(String),
      kind: "IResponseErrorValidation"
    });
    response.apply(res);
    expect(res.status).toBeCalledWith(400);
  });
});

describe("SSOController#getUserForBPD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("calls the getUserForBPD on the SSOController with valid values", async () => {
    const req = mockReq();
    const res = mockRes();

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const response = await getUserForBPD(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: bpdUserResponse
    });
    response.apply(res);
    expect(res.json).toBeCalledWith(bpdUserResponse);
  });
});
