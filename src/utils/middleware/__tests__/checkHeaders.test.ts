import { checkAcceptHeader, checkContentTypeHeader, validate } from '../checkHeaders';
import { Request, Response } from "Express";
import { some, none } from 'fp-ts/lib/Option';
import { isRight, isLeft } from 'fp-ts/lib/Either';
import { log } from "../../logger"

jest.spyOn(log, "warn");

describe("checkHeadersMiddleware.validate", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be right if we provide at least one expected header value (header with single value)", async () => {
        const expectedHeaderValues = ["a", "b", "x"];
        const headerValue = "x";
        const validator = validate(expectedHeaderValues);

        const result = validator(some(headerValue));

        expect(isRight(result)).toBe(true);
    })

    it("should be left('unexpected-header-values') if we do not provide at least one expected header value (header with single value)", async () => {
        const expectedHeaderValues = ["a", "b", "c"];
        const headerValue = "x";
        const validator = validate(expectedHeaderValues);

        const result = validator(some(headerValue));

        expect(isLeft(result)).toBe(true);
        expect(result.value).toBe("unexpected-header-values");
    })

    it("should be right if we provide at least one expected header value (header with multiple values)", async () => {
        const expectedHeaderValues = ["a", "b", "x"];
        const headerValue = "x,y,z";
        const validator = validate(expectedHeaderValues);

        const result = validator(some(headerValue));

        expect(isRight(result)).toBe(true);
    })

    it("should be left('unexpected-header-values') if we do not provide at least one expected header value (header with multiple values)", async () => {
        const expectedHeaderValues = ["a", "b", "c"];
        const headerValue = "x,y,z";
        const validator = validate(expectedHeaderValues);

        const result = validator(some(headerValue));

        expect(isLeft(result)).toBe(true);
        expect(result.value).toBe("unexpected-header-values");
    })

    it("should be right if we provide at least one expected header value (header with multiple values, dirty with spaces)", async () => {
        const expectedHeaderValues = ["a", "b", "x"];
        const headerValue = " x , y , z ";
        const validator = validate(expectedHeaderValues);

        const result = validator(some(headerValue));

        expect(isRight(result)).toBe(true);
    })

    it("should be left('unexpected-header-values') if we do not provide at least one expected header value (header with multiple values, dirty with spaces)", async () => {
        const expectedHeaderValues = ["a", "b", "c"];
        const headerValue = " x , y , z ";
        const validator = validate(expectedHeaderValues);

        const result = validator(some(headerValue));

        expect(isLeft(result)).toBe(true);
        expect(result.value).toBe("unexpected-header-values");
    })

    it("should be right if we provide at least one expected header value (header with multiple values, dirty with spaces and q-factor)", async () => {
        const expectedHeaderValues = ["a", "b", "x"];
        const headerValue = " x;q=0.9 , y;q=0.8 , z;q=0.7 ";
        const validator = validate(expectedHeaderValues);

        const result = validator(some(headerValue));

        expect(isRight(result)).toBe(true);
    })

    it("should be left('unexpected-header-values') if we do not provide at least one expected header value (header with multiple values, dirty with spaces and q-factor)", async () => {
        const expectedHeaderValues = ["a", "b", "c"];
        const headerValue = " x;q=0.9 , y;q=0.8 , z;q=0.7 ";
        const validator = validate(expectedHeaderValues);

        const result = validator(some(headerValue));

        expect(isLeft(result)).toBe(true);
        expect(result.value).toBe("unexpected-header-values");
    })

    it("should be left('no-header') if we provide some expected values but there is no header to check", async () => {
        const expectedHeaderValues = ["a", "b", "c"];
        const validator = validate(expectedHeaderValues);

        const result = validator(none);

        expect(isLeft(result)).toBe(true);
        expect(result.value).toBe("no-header");
    })

    it("should be left('no-expected-headers-provided') if we provide an empty list of expected values", async () => {
        const expectedHeaderValues: string[] = [];
        const validator = validate(expectedHeaderValues);

        const result = validator(none);

        expect(isLeft(result)).toBe(true);
        expect(result.value).toBe("no-expected-headers-provided");
    })
});

describe("checkHeadersMiddleware.checkAcceptHeader", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each`
    acceptedContentType | accept
        ${["x"]} | ${"x"}
        ${["x", "y", "z"]} | ${"x"}
        ${["a", "b", "x"]} | ${"x,y,z"}
        ${["a", "b", "x"]} | ${"x;q=0.9,y;q=0.8,z;q=0.7"}
        ${["a", "b", "x"]} | ${" x , y , z "}
        ${["a", "b", "x"]} | ${" x;q=0.9 , y; q=0.8, z;q=0.7 "}
    `("should continue without logging if request's accept header contains expected values", async () => {
        // build middleware
        const expectedAccept = ["x"];
        const middleware = checkAcceptHeader(expectedAccept);

        // mock middleware's inputs
        const mockRequest = {
            headers: { "accept": "x" }
        } as Request;
        const mockResponse = {} as Response;
        const mockNext = jest.fn();

        // execute middleware 
        middleware(mockRequest, mockResponse, mockNext);

        // check that next() is called correctly
        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();

        // check that logger has not been called
        expect(log.warn).not.toHaveBeenCalled();
    });

    it.each`
    acceptedContentType | accept
        ${["y"]} | ${"x"}
        ${["a", "y", "z"]} | ${"x"}
        ${["a", "b", "c"]} | ${"x,y,z"}
        ${["a", "b", "c"]} | ${"x;q=0.9,y;q=0.8,z;q=0.7"}
        ${["a", "b", "c"]} | ${" x , y , z "}
        ${["a", "b", "c"]} | ${" x;q=0.9 , y; q=0.8, z;q=0.7 "}
    `("should continue with logging('Accept header does not contain any of expected values') if request's accept header does not contains expected values", async () => {
        // build middleware
        const expectedAccept = ["y"];
        const middleware = checkAcceptHeader(expectedAccept);

        // mock middleware's inputs
        const mockRequest = {
            headers: { "accept": "x" }
        } as Request;
        const mockResponse = {} as Response;
        const mockNext = jest.fn();

        // execute middleware 
        middleware(mockRequest, mockResponse, mockNext);

        // check that next() is called correctly
        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();

        // check that logger has been called
        expect(log.warn).toHaveBeenCalled();
        expect(log.warn).toHaveBeenCalledTimes(1);
        expect(log.warn).toHaveBeenCalledWith("Accept header does not contain any of expected values");
    });

    it.each`
    acceptedContentType | accept
        ${["x"]} | ${"x"}
        ${["x", "y", "z"]} | ${"x"}
        ${["a", "b", "x"]} | ${"x,y,z"}
        ${["a", "b", "x"]} | ${"x;q=0.9,y;q=0.8,z;q=0.7"}
        ${["a", "b", "x"]} | ${" x , y , z "}
        ${["a", "b", "x"]} | ${" x;q=0.9 , y; q=0.8, z;q=0.7 "}
    `("should continue with logging('No accept header found') if there is not an accept header in request", async () => {
        // build middleware
        const expectedAccept = ["y"];
        const middleware = checkAcceptHeader(expectedAccept);

        // mock middleware's inputs
        const mockRequest = {
            headers: {}
        } as Request;
        const mockResponse = {} as Response;
        const mockNext = jest.fn();

        // execute middleware 
        middleware(mockRequest, mockResponse, mockNext);

        // check that next() is called correctly
        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();

        // check that logger has been called
        expect(log.warn).toHaveBeenCalled();
        expect(log.warn).toHaveBeenCalledTimes(1);
        expect(log.warn).toHaveBeenCalledWith("No accept header found");
    });

    it.each`
    acceptedContentType | accept
        ${["x"]} | ${"x"}
        ${["x", "y", "z"]} | ${"x"}
        ${["a", "b", "x"]} | ${"x,y,z"}
        ${["a", "b", "x"]} | ${"x;q=0.9,y;q=0.8,z;q=0.7"}
        ${["a", "b", "x"]} | ${" x , y , z "}
        ${["a", "b", "x"]} | ${" x;q=0.9 , y; q=0.8, z;q=0.7 "}
    `("should continue with logging('Cannot check headers if you do not provide expected values') if we provide an empty list of expected headers", async () => {
        // build middleware
        const expectedAccept: string[] = [];
        const middleware = checkAcceptHeader(expectedAccept);

        // mock middleware's inputs
        const mockRequest = {
            headers: { "accept": "x" }
        } as Request;
        const mockResponse = {} as Response;
        const mockNext = jest.fn();

        // execute middleware 
        middleware(mockRequest, mockResponse, mockNext);

        // check that next() is called correctly
        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();

        // check that logger has been called
        expect(log.warn).toHaveBeenCalled();
        expect(log.warn).toHaveBeenCalledTimes(1);
        expect(log.warn).toHaveBeenCalledWith("Cannot check headers if you do not provide expected values");
    });
});

describe("checkHeadersMiddleware.checkContentTypeHeader", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each`
    acceptedContentType | accept
        ${["x"]} | ${"x"}
        ${["x", "y", "z"]} | ${"x"}
        ${["a", "b", "x"]} | ${"x,y,z"}
        ${["a", "b", "x"]} | ${"x;q=0.9,y;q=0.8,z;q=0.7"}
        ${["a", "b", "x"]} | ${" x , y , z "}
        ${["a", "b", "x"]} | ${" x;q=0.9 , y; q=0.8, z;q=0.7 "}
    `("should continue without logging if request's content-type header contains expected values", async () => {
        // build middleware
        const expectedAccept = ["x"];
        const middleware = checkContentTypeHeader(expectedAccept);

        // mock middleware's inputs
        const mockRequest = {
            headers: { "content-type": "x" }
        } as Request;
        const mockResponse = {} as Response;
        const mockNext = jest.fn();

        // execute middleware 
        middleware(mockRequest, mockResponse, mockNext);

        // check that next() is called correctly
        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();

        // check that logger has not been called
        expect(log.warn).not.toHaveBeenCalled();
    });

    it.each`
    acceptedContentType | accept
        ${["y"]} | ${"x"}
        ${["a", "y", "z"]} | ${"x"}
        ${["a", "b", "c"]} | ${"x,y,z"}
        ${["a", "b", "c"]} | ${"x;q=0.9,y;q=0.8,z;q=0.7"}
        ${["a", "b", "c"]} | ${" x , y , z "}
        ${["a", "b", "c"]} | ${" x;q=0.9 , y; q=0.8, z;q=0.7 "}
    `("should continue with logging('Content-type header does not contain any of expected values') if request's content-type header does not contains expected values", async () => {
        // build middleware
        const expectedAccept = ["y"];
        const middleware = checkContentTypeHeader(expectedAccept);

        // mock middleware's inputs
        const mockRequest = {
            headers: { "content-type": "x" }
        } as Request;
        const mockResponse = {} as Response;
        const mockNext = jest.fn();

        // execute middleware 
        middleware(mockRequest, mockResponse, mockNext);

        // check that next() is called correctly
        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();

        // check that logger has been called
        expect(log.warn).toHaveBeenCalled();
        expect(log.warn).toHaveBeenCalledTimes(1);
        expect(log.warn).toHaveBeenCalledWith("Content-type header does not contain any of expected values");
    });

    it.each`
    acceptedContentType | accept
        ${["x"]} | ${"x"}
        ${["x", "y", "z"]} | ${"x"}
        ${["a", "b", "x"]} | ${"x,y,z"}
        ${["a", "b", "x"]} | ${"x;q=0.9,y;q=0.8,z;q=0.7"}
        ${["a", "b", "x"]} | ${" x , y , z "}
        ${["a", "b", "x"]} | ${" x;q=0.9 , y; q=0.8, z;q=0.7 "}
    `("should continue with logging('No content-type header found') if there is not an content-type header in request", async () => {
        // build middleware
        const expectedAccept = ["y"];
        const middleware = checkContentTypeHeader(expectedAccept);

        // mock middleware's inputs
        const mockRequest = {
            headers: {}
        } as Request;
        const mockResponse = {} as Response;
        const mockNext = jest.fn();

        // execute middleware 
        middleware(mockRequest, mockResponse, mockNext);

        // check that next() is called correctly
        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();

        // check that logger has been called
        expect(log.warn).toHaveBeenCalled();
        expect(log.warn).toHaveBeenCalledTimes(1);
        expect(log.warn).toHaveBeenCalledWith("No content-type header found");
    });

    it.each`
    acceptedContentType | accept
        ${["x"]} | ${"x"}
        ${["x", "y", "z"]} | ${"x"}
        ${["a", "b", "x"]} | ${"x,y,z"}
        ${["a", "b", "x"]} | ${"x;q=0.9,y;q=0.8,z;q=0.7"}
        ${["a", "b", "x"]} | ${" x , y , z "}
        ${["a", "b", "x"]} | ${" x;q=0.9 , y; q=0.8, z;q=0.7 "}
    `("should continue with logging('Cannot check headers if you do not provide expected values') if we provide an empty list of expected headers", async () => {
        // build middleware
        const expectedAccept: string[] = [];
        const middleware = checkContentTypeHeader(expectedAccept);

        // mock middleware's inputs
        const mockRequest = {
            headers: { "content-type": "x" }
        } as Request;
        const mockResponse = {} as Response;
        const mockNext = jest.fn();

        // execute middleware 
        middleware(mockRequest, mockResponse, mockNext);

        // check that next() is called correctly
        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();

        // check that logger has been called
        expect(log.warn).toHaveBeenCalled();
        expect(log.warn).toHaveBeenCalledTimes(1);
        expect(log.warn).toHaveBeenCalledWith("Cannot check headers if you do not provide expected values");
    });
});
