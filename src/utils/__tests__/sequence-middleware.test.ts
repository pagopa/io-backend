import { ExpressMiddleware } from "../express";
import { sequenceMiddleware } from "../sequence-middleware";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import * as express from "express";

describe("SequenceMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockResponse = mockRes();
  const mockNext = jest.fn().mockImplementation(() => {});
  const successMiddleware: ExpressMiddleware = jest
    .fn()
    .mockImplementation((_req, _res, next) => {
      next();
    });
  const errorMiddleware: ExpressMiddleware = jest
    .fn()
    .mockImplementation((_req, res, _next) => {
      return res.status(500).send();
    });

  it("Should execute middlewares", () => {
    sequenceMiddleware(successMiddleware, successMiddleware)(
      mockReq as unknown as express.Request,
      mockResponse as unknown as express.Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledTimes(1);
    // response will be set from handler ahead of this middleware chain
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.send).not.toHaveBeenCalled();
  });

  it("Should stop on error middleware", () => {
    sequenceMiddleware(successMiddleware, errorMiddleware)(
      mockReq as unknown as express.Request,
      mockResponse as unknown as express.Response,
      mockNext
    );

    expect(mockNext).not.toHaveBeenCalled();
    expect(successMiddleware).toHaveBeenCalledTimes(1);
    expect(errorMiddleware).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledTimes(1);
  });

  it.each`
    lastMiddleware
    ${successMiddleware}
    ${errorMiddleware}
  `(
    "Should not call last middleware if an error was catched on the first",
    ({ lastMiddleware }) => {
      sequenceMiddleware(errorMiddleware, lastMiddleware)(
        mockReq as unknown as express.Request,
        mockResponse as unknown as express.Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(successMiddleware).not.toHaveBeenCalled();
      expect(errorMiddleware).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledTimes(1);
    }
  );

  it("Should propagate an error instead of sending response", () => {
    const propageErrorMiddleware: ExpressMiddleware = jest
      .fn()
      .mockImplementation((_req, _res, next) => {
        const anError = Error("unknown");
        next(anError);
      });
    sequenceMiddleware(propageErrorMiddleware, errorMiddleware)(
      mockReq as unknown as express.Request,
      mockResponse as unknown as express.Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(propageErrorMiddleware).toHaveBeenCalledTimes(1);
    expect(errorMiddleware).not.toHaveBeenCalled();

    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.send).not.toHaveBeenCalled();
  });
});
