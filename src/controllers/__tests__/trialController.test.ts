/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */

import { ResponseSuccessAccepted, ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";

import mockReq from "../../__mocks__/request";
import { mockedUser } from "../../__mocks__/user_mock";
import TrialController from "../trialController";
import TrialService from "../../services/trialService";
import { SubscriptionStateEnum } from "../../../generated/trial-system/SubscriptionState";

const aTrialId: string = "trial-id";
const nowDate = new Date();

const aValidSubscription = {
  trialId: aTrialId,
  state: SubscriptionStateEnum.SUBSCRIBED,
  createdAt: nowDate,
};
const mockCreateSubscription = jest.fn();
const mockGetSubscription = jest.fn();

const trialServiceMock = {
  createSubscription: mockCreateSubscription,
  getSubscription: mockGetSubscription
} as any as TrialService;

describe("trialController#createTrialSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the createSubscrition on the TrialController with valid values", async () => {
    const req = mockReq();

    mockCreateSubscription.mockReturnValue(
      Promise.resolve(ResponseSuccessAccepted())
    );

    req.user = mockedUser;
    req.params = { trialId: aTrialId };
    const controller = new TrialController(trialServiceMock);

    const response = await controller.createTrialSubscription(req);

    expect(mockCreateSubscription).toHaveBeenCalledWith(mockedUser.fiscal_code, aTrialId);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessAccepted"
    });
  });

  it("calls the createSubscrition on the TrialController with invalid values", async () => {
    const req = mockReq();

    req.user = mockedUser;
    req.params = { trialId: "" };
    const controller = new TrialController(trialServiceMock);

    const response = await controller.createTrialSubscription(req);

    expect(mockCreateSubscription).not.toHaveBeenCalled();
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorValidation",
      detail: expect.stringContaining("Bad request")
    });
  });
});

describe("trialController#getTrialSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getSubscrition on the TrialController with valid values", async () => {
    const req = mockReq();

    mockGetSubscription.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aValidSubscription))
    );

    req.user = mockedUser;
    req.params = { trialId: aTrialId };
    const controller = new TrialController(trialServiceMock);

    const response = await controller.getTrialSubscription(req);

    expect(mockGetSubscription).toHaveBeenCalledWith(mockedUser.fiscal_code, aTrialId);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aValidSubscription
    });
  });

  it("calls the getSubscrition on the TrialController with invalid values", async () => {
    const req = mockReq();

    req.user = mockedUser;
    req.params = { trialId: "" };
    const controller = new TrialController(trialServiceMock);

    const response = await controller.getTrialSubscription(req);

    expect(mockGetSubscription).not.toHaveBeenCalled();
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorValidation",
      detail: expect.stringContaining("Bad request")
    });
  });
});
