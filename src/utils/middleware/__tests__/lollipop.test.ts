import { LollipopApiClient } from "../../../clients/lollipop";
import { ISessionStorage } from "../../../services/ISessionStorage";
import { lollipopMiddleware } from "../lollipop";
import mockReq from "../../../__mocks__/request";
import { aFiscalCode, mockedUser } from "../../../__mocks__/user_mock";
import { anAssertionRef } from "../../../__mocks__/lollipop";
import mockRes from "../../../__mocks__/response";
import * as E from "fp-ts/Either";
import { AssertionTypeEnum } from "../../../../generated/lollipop-api/AssertionType";
import * as O from "fp-ts/Option";
import { PubKeyStatusEnum } from "../../../../generated/lollipop-api/PubKeyStatus";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

const mockGenerateLCParams = jest.fn();
const mockClient = {
  generateLCParams: mockGenerateLCParams,
  activatePubKey: jest.fn(),
  ping: jest.fn(),
  reservePubKey: jest.fn()
} as ReturnType<typeof LollipopApiClient>;

const mockGetlollipopAssertionRefForUser = jest
  .fn()
  .mockResolvedValue(E.right(O.some(anAssertionRef)));
const mockSessionStorage = ({
  getLollipopAssertionRefForUser: mockGetlollipopAssertionRefForUser
} as unknown) as ISessionStorage;

const aBearerToken = "a bearer token";
const aPubKey = "a pub key";

const mockNext = jest.fn();
describe("lollipopMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it(`
  GIVEN a valid user and valid Lollipop Headers
  WHEN redis returns an assertionRef for the user and lollipop-fn generate LC Params
  THEN additional lollipop headers are included in res.locals
  `, async () => {
    const lollipopRequestHeaders = {
      signature: `sig1=:hNojB+wWw4A7SYF3qK1S01Y4UP5i2JZFYa2WOlMB4Np5iWmJSO0bDe2hrYRbcIWqVAFjuuCBRsB7lYQJkzbb6g==:`,
      ["signature-input"]: `sig1=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url"); created=1618884475; keyid="test-key-rsa-pss"`,
      ["x-pagopa-lollipop-original-method"]: "POST",
      ["x-pagopa-lollipop-original-url"]: "https://api.pagopa.it"
    };
    const req = mockReq({
      headers: lollipopRequestHeaders,
      user: mockedUser
    });
    const res = mockRes();
    mockGenerateLCParams.mockResolvedValueOnce(
      E.right({
        status: 200,
        value: {
          fiscal_code: aFiscalCode,
          assertion_file_name: `${aFiscalCode}-${anAssertionRef}`,
          assertion_type: AssertionTypeEnum.SAML,
          expired_at: Date.now(),
          lc_authentication_bearer: aBearerToken,
          assertion_ref: anAssertionRef,
          pub_key: aPubKey,
          version: 1,
          status: PubKeyStatusEnum.VALID,
          ttl: 900
        }
      })
    );
    const middleware = lollipopMiddleware(mockClient, mockSessionStorage);
    await middleware(req, res, mockNext);
    expect(mockGenerateLCParams).toBeCalledTimes(1);
    expect(mockGenerateLCParams).toBeCalledWith({
      assertion_ref: anAssertionRef,
      body: {
        operation_id: expect.any(String)
      }
    });
    expect(res.json).not.toBeCalledWith();
    expect(res.status).not.toBeCalled();
    expect(res.locals).toEqual({
      ["x-pagopa-lollipop-assertion-ref"]: anAssertionRef,
      ["x-pagopa-lollipop-assertion-type"]: AssertionTypeEnum.SAML,
      ["x-pagopa-lollipop-auth-jwt"]: aBearerToken,
      ["x-pagopa-lollipop-public-key"]: aPubKey,
      ["x-pagopa-lollipop-user-id"]: aFiscalCode,
      ...lollipopRequestHeaders
    });
    expect(mockNext).toBeCalledTimes(1);
    expect(mockNext).toBeCalledWith();
  });

  it(`
  GIVEN a valid user and Lollipop Headers
  WHEN the headers are invalid
  THEN returns a validation error
  `, async () => {
    const lollipopRequestHeaders = {
      signature: `sig1=:hNojB+wWw4A7SYF3qK1S01Y4UP5i2JZFYa2WOlMB4Np5iWmJSO0bDe2hrYRbcIWqVAFjuuCBRsB7lYQJkzbb6g==:`,
      ["signature-input"]: `sig1=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url"); created=1618884475; keyid="test-key-rsa-pss"`,
      ["x-pagopa-lollipop-original-method"]: "POST"
    };
    const req = mockReq({
      headers: lollipopRequestHeaders,
      user: mockedUser
    });
    const res = mockRes();
    const middleware = lollipopMiddleware(mockClient, mockSessionStorage);
    await middleware(req, res, mockNext);
    expect(mockGetlollipopAssertionRefForUser).not.toBeCalled();
    expect(mockGenerateLCParams).not.toBeCalled();
    expect(res.status).toBeCalledWith(400);
    expect(mockNext).not.toBeCalled();
  });

  it(`
  GIVEN a user and valid Lollipop Headers
  WHEN the user is invalid
  THEN returns a validation error
  `, async () => {
    const lollipopRequestHeaders = {
      signature: `sig1=:hNojB+wWw4A7SYF3qK1S01Y4UP5i2JZFYa2WOlMB4Np5iWmJSO0bDe2hrYRbcIWqVAFjuuCBRsB7lYQJkzbb6g==:`,
      ["signature-input"]: `sig1=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url"); created=1618884475; keyid="test-key-rsa-pss"`,
      ["x-pagopa-lollipop-original-method"]: "POST",
      ["x-pagopa-lollipop-original-url"]: "https://api.pagopa.it"
    };
    const req = mockReq({
      headers: lollipopRequestHeaders,
      user: { ...mockedUser, fiscal_code: "invalidFiscalCode" }
    });
    const res = mockRes();
    const middleware = lollipopMiddleware(mockClient, mockSessionStorage);
    await middleware(req, res, mockNext);
    expect(mockGetlollipopAssertionRefForUser).not.toBeCalled();
    expect(mockGenerateLCParams).not.toBeCalled();
    expect(res.status).toBeCalledWith(400);
    expect(mockNext).not.toBeCalled();
  });

  it.each`
    title                                                    | lollipopAssertionRefForUser                                          | expectedResponseStatus
    ${"the lollipopAssertionRefForUser rejects"}             | ${Promise.reject(new Error("promise reject"))}                       | ${500}
    ${"the lollipopAssertionRefForUser returns an error"}    | ${Promise.resolve(E.left(new Error("Error executing the request")))} | ${500}
    ${"the lollipopAssertionRefForUser not found the value"} | ${Promise.resolve(E.right(O.none))}                                  | ${403}
  `(
    `
  GIVEN a valid user and Lollipop Headers
  WHEN $title
  THEN returns a response error with status $expectedResponseStatus
  `,
    async ({ lollipopAssertionRefForUser, expectedResponseStatus }) => {
      const lollipopRequestHeaders = {
        signature: `sig1=:hNojB+wWw4A7SYF3qK1S01Y4UP5i2JZFYa2WOlMB4Np5iWmJSO0bDe2hrYRbcIWqVAFjuuCBRsB7lYQJkzbb6g==:`,
        ["signature-input"]: `sig1=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url"); created=1618884475; keyid="test-key-rsa-pss"`,
        ["x-pagopa-lollipop-original-method"]: "POST",
        ["x-pagopa-lollipop-original-url"]: "https://api.pagopa.it"
      };
      const req = mockReq({
        headers: lollipopRequestHeaders,
        user: mockedUser
      });
      const res = mockRes();
      mockGetlollipopAssertionRefForUser.mockImplementationOnce(
        () => lollipopAssertionRefForUser
      );
      const middleware = lollipopMiddleware(mockClient, mockSessionStorage);
      await middleware(req, res, mockNext);
      expect(mockGenerateLCParams).not.toBeCalled();
      expect(res.status).toBeCalledWith(expectedResponseStatus);
      expect(mockNext).not.toBeCalled();
    }
  );

  it.each`
    title                                            | generateLCParams                               | expectedResponseStatus
    ${"the generateLCParams rejects"}                | ${Promise.reject(new Error("promise reject"))} | ${500}
    ${"the generateLCParams returns an error"}       | ${Promise.resolve(NonEmptyString.decode(""))}  | ${500}
    ${"the generateLCParams returns bad request"}    | ${Promise.resolve(E.right({ status: 400 }))}   | ${500}
    ${"the generateLCParams returns forbidden"}      | ${Promise.resolve(E.right({ status: 403 }))}   | ${403}
    ${"the generateLCParams returns not found"}      | ${Promise.resolve(E.right({ status: 404 }))}   | ${500}
    ${"the generateLCParams returns error internal"} | ${Promise.resolve(E.right({ status: 500 }))}   | ${500}
  `(
    `
  GIVEN a valid user and Lollipop Headers
  WHEN $title
  THEN returns an error with status $expectedResponseStatus
  `,
    async ({ generateLCParams, expectedResponseStatus }) => {
      const lollipopRequestHeaders = {
        signature: `sig1=:hNojB+wWw4A7SYF3qK1S01Y4UP5i2JZFYa2WOlMB4Np5iWmJSO0bDe2hrYRbcIWqVAFjuuCBRsB7lYQJkzbb6g==:`,
        ["signature-input"]: `sig1=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url"); created=1618884475; keyid="test-key-rsa-pss"`,
        ["x-pagopa-lollipop-original-method"]: "POST",
        ["x-pagopa-lollipop-original-url"]: "https://api.pagopa.it"
      };
      const req = mockReq({
        headers: lollipopRequestHeaders,
        user: mockedUser
      });
      const res = mockRes();
      mockGenerateLCParams.mockImplementationOnce(() => generateLCParams);
      const middleware = lollipopMiddleware(mockClient, mockSessionStorage);
      await middleware(req, res, mockNext);
      expect(mockGenerateLCParams).toBeCalledTimes(1);
      expect(res.status).toBeCalledWith(expectedResponseStatus);
      expect(mockNext).not.toBeCalled();
    }
  );
});
