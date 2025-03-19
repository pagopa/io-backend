import { Request } from "express";
import { getPing } from "../pingController";
import mockRes from "../../__mocks__/response";

const res = mockRes();

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