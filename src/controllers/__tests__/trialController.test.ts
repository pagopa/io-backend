/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */

import { ResponseSuccessAccepted } from "@pagopa/ts-commons/lib/responses";

import mockReq from "../../__mocks__/request";
import { mockedUser } from "../../__mocks__/user_mock";
import TrialController from "../trialController";
import TrialService from "../../services/trialService";

const aTrialId: string = "trial-id";
const mockCreateSubscription = jest.fn();

const trialServiceMock = {
  createSubscription: mockCreateSubscription
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
