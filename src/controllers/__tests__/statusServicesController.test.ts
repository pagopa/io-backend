import { Request } from "express";
import { getPing, getStatusServices } from "../statusServicesController";
import mockRes from "../../__mocks__/response";
import { mockServicesStatus } from "../__mocks__/statusServices";

const res = mockRes();

describe("getStatusServices", () => {
  it("should return a success response with the correct service status", async () => {
    const mockRequest = {} as Request;
    const result = await getStatusServices(mockRequest);
    expect(result).toEqual({
        apply: expect.any(Function),
        kind: "IResponseSuccessJson",
        value: mockServicesStatus,
      });
      result.apply(res);
      expect(res.json).toHaveBeenCalledWith(mockServicesStatus);
  });
});

describe("getPing", () => {
  it("should return a success no content response", async () => {
    const mockRequest = {} as Request;
    const result = await getPing(mockRequest);
    expect(result).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessNoContent",
    });
    result.apply(res);
    expect(res.status).toHaveBeenCalledWith(204);
  });
});