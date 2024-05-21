/* tslint:disable:no-identical-functions */

import * as t from "io-ts";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { TrialSystemAPIClient } from "../../clients/trial-system.client";
import TrialService from "../trialService";
import { TrialId } from "../../../generated/trial-system-api/TrialId";
import { SubscriptionStateEnum } from "../../../generated/trial-system-api/SubscriptionState";

const aTrialId = "trial-id" as TrialId;
const aUserId = "aUserId" as NonEmptyString;
const nowDate = new Date();

const aValidCreatedSubscription = {
  trialId: aTrialId,
  userId: aUserId,
  state: SubscriptionStateEnum.SUBSCRIBED,
  createdAt: nowDate,
  updatedAt: nowDate
};

const validApiRedirectToResourceResponse = {
  status: 201,
  value: aValidCreatedSubscription
};
const validApiAcceptedResponse = {
  status: 202
};
const notFoundApiResponse = {
  status: 404,
};
const conflictReqApiMessagesResponse = {
  status: 409,
};
const problemJson = {
  status: 500,
};

const mockCreateSubscription = jest.fn();
const api = {
  createSubscription: mockCreateSubscription
} as any as ReturnType<TrialSystemAPIClient>;

// ----------------------------
// Tests
// ----------------------------

beforeEach(() => {
  jest.clearAllMocks();
});


describe("TrialService#createSubscription", () => {
  it("returns 201 from the API if subscription request was processed in sync", async () => {
    mockCreateSubscription.mockImplementation(() => {
      return t.success(validApiRedirectToResourceResponse);
    });

    const service = new TrialService(
      api
    );

    const res = await service.createSubscription(aUserId, aTrialId);

    expect(mockCreateSubscription).toHaveBeenCalledWith({
      body: {
        userId: aUserId,
      },
      trialId: aTrialId
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessRedirectToResource",
      value: aValidCreatedSubscription,
    });
  });

  it("returns 202 from the API if subscription request was processed in async", async () => {
    mockCreateSubscription.mockImplementationOnce(() =>
      t.success(validApiAcceptedResponse)
    );

    const service = new TrialService(
      api
    );

    const res = await service.createSubscription(aUserId, aTrialId);

    expect(mockCreateSubscription).toHaveBeenCalledWith({
      body: {
        userId: aUserId,
      },
      trialId: aTrialId
    });
    expect(res.kind).toEqual("IResponseSuccessAccepted");
  });

  it("returns 404 from the API if subscription trial not exists", async () => {
    mockCreateSubscription.mockImplementationOnce(() =>
      t.success(notFoundApiResponse)
    );

    const service = new TrialService(
      api
    );

    const res = await service.createSubscription(aUserId, aTrialId);

    expect(mockCreateSubscription).toHaveBeenCalledWith({
      body: {
        userId: aUserId,
      },
      trialId: aTrialId
    });
    expect(res.kind).toEqual("IResponseErrorNotFound");
  });

  it("returns an 409 HTTP error from createSubscription upstream API", async () => {
    mockCreateSubscription.mockImplementationOnce(() =>
      t.success(conflictReqApiMessagesResponse)
    );

    const service = new TrialService(
      api
    );

    const res = await service.createSubscription(aUserId, aTrialId);

    expect(mockCreateSubscription).toHaveBeenCalledWith({
      body: {
        userId: aUserId,
      },
      trialId: aTrialId
    });
    expect(res.kind).toEqual("IResponseErrorConflict");
  });

  it("returns an error if the getMessagesByUser API returns an error", async () => {
    mockCreateSubscription.mockImplementationOnce(() => t.success(problemJson));
    const service = new TrialService(
      api
    );

    const res = await service.createSubscription(aUserId, aTrialId);

    expect(mockCreateSubscription).toHaveBeenCalledWith({
      body: {
        userId: aUserId,
      },
      trialId: aTrialId
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});