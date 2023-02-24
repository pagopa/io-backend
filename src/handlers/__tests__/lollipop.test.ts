import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import * as t from "io-ts";
import * as jose from "jose";
import { AssertionRef } from "../../../generated/lollipop-api/AssertionRef";
import { JwkPubKey } from "../../../generated/lollipop-api/JwkPubKey";
import { NewPubKey } from "../../../generated/lollipop-api/NewPubKey";
import { PubKeyStatusEnum } from "../../../generated/lollipop-api/PubKeyStatus";
import { lollipopLoginHandler } from "../lollipop";
import mockReq from "../../__mocks__/request";
import {
  LOLLIPOP_PUB_KEY_HASHING_ALGO_HEADER_NAME,
  LOLLIPOP_PUB_KEY_HEADER_NAME
} from "@pagopa/io-spid-commons/dist/types/lollipop";
import * as E from "fp-ts/lib/Either";
import { JwkPubKeyHashAlgorithmEnum } from "../../../generated/lollipop-api/JwkPubKeyHashAlgorithm";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { anEncodedJwkPubKey } from "../../__mocks__/lollipop";

const aJwkPubKey: JwkPubKey = {
  alg: "alg",
  e: "e",
  kty: "RSA",
  n: "n"
};
const aNewPubKey: NewPubKey = {
  assertion_ref: "sha256-123ac" as AssertionRef,
  pub_key: anEncodedJwkPubKey,
  status: PubKeyStatusEnum.PENDING,
  ttl: 2 as NonNegativeInteger,
  version: 0 as NonNegativeInteger
};

const tokenizeJwk = (jwk: JwkPubKey) =>
  jose.base64url.encode(JSON.stringify(jwk));

const buildResponse = <T>(statusCode: number, value: T) =>
  ({
    headers: {},
    status: statusCode,
    value
  } as IResponseType<number, T, never>);
const reservePubKeyMock = jest
  .fn()
  .mockImplementation(async () => t.success(buildResponse(201, aNewPubKey)));
const lollipopApiClientMock = {
  reservePubKey: reservePubKeyMock
} as any;

describe("lollipopLoginHandler", () => {
  afterEach(() => jest.clearAllMocks());

  it("should not perform pubkey reservation if Lollipop FF is disabled", async () => {
    const req = mockReq();
    req.headers[LOLLIPOP_PUB_KEY_HEADER_NAME] = tokenizeJwk(aJwkPubKey);
    req.headers[LOLLIPOP_PUB_KEY_HASHING_ALGO_HEADER_NAME] = "sha512";
    const result = await lollipopLoginHandler(
      false,
      lollipopApiClientMock
    )(req);
    expect(reservePubKeyMock).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("should perform lollipop validation and pubkey reservation successfully if Lollipop pub key and algo headers are present", async () => {
    const req = mockReq();
    req.headers[LOLLIPOP_PUB_KEY_HEADER_NAME] = tokenizeJwk(aJwkPubKey);
    req.headers[LOLLIPOP_PUB_KEY_HASHING_ALGO_HEADER_NAME] = "sha512";
    const result = await lollipopLoginHandler(true, lollipopApiClientMock)(req);
    expect(reservePubKeyMock).toHaveBeenCalledTimes(1);
    expect(reservePubKeyMock).toHaveBeenCalledWith({
      body: {
        algo: JwkPubKeyHashAlgorithmEnum.sha512,
        pub_key: aJwkPubKey
      }
    });
    expect(result).toBeUndefined();
  });

  it("should perform lollipop validation and pubkey reservation successfully if Lollipop pub key is present with fallback on default hashing algorithm", async () => {
    const req = mockReq();
    req.headers[LOLLIPOP_PUB_KEY_HEADER_NAME] = tokenizeJwk(aJwkPubKey);
    const result = await lollipopLoginHandler(true, lollipopApiClientMock)(req);
    expect(reservePubKeyMock).toHaveBeenCalledTimes(1);
    expect(reservePubKeyMock).toHaveBeenCalledWith({
      body: {
        algo: JwkPubKeyHashAlgorithmEnum.sha256,
        pub_key: aJwkPubKey
      }
    });
    expect(result).toBeUndefined();
  });

  it("should not perform lollipop validation and pubkey reservation if no lollipop headers are present", async () => {
    const req = mockReq();
    const result = await lollipopLoginHandler(true, lollipopApiClientMock)(req);
    expect(reservePubKeyMock).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("should return InternalServerError if reservePubKey cannot be parsed", async () => {
    const req = mockReq();
    req.headers[LOLLIPOP_PUB_KEY_HEADER_NAME] = tokenizeJwk(aJwkPubKey);
    reservePubKeyMock.mockImplementationOnce(async () =>
      E.left("unparseable response")
    );
    const result = await lollipopLoginHandler(true, lollipopApiClientMock)(req);
    expect(reservePubKeyMock).toHaveBeenCalledTimes(1);
    expect(reservePubKeyMock).toHaveBeenCalledWith({
      body: {
        algo: JwkPubKeyHashAlgorithmEnum.sha256,
        pub_key: aJwkPubKey
      }
    });

    expect(result).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorInternal",
        detail: "Internal server error: Cannot parse reserve response"
      })
    );
  });

  it("should return a conflict error if pubKey is alredy reserved", async () => {
    const req = mockReq();
    req.headers[LOLLIPOP_PUB_KEY_HEADER_NAME] = tokenizeJwk(aJwkPubKey);
    reservePubKeyMock.mockImplementationOnce(async () =>
      t.success(buildResponse(409, {}))
    );
    const result = await lollipopLoginHandler(true, lollipopApiClientMock)(req);
    expect(reservePubKeyMock).toHaveBeenCalledTimes(1);
    expect(reservePubKeyMock).toHaveBeenCalledWith({
      body: {
        algo: JwkPubKeyHashAlgorithmEnum.sha256,
        pub_key: aJwkPubKey
      }
    });

    expect(result).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorConflict",
        detail: "Conflict: PubKey is already reserved"
      })
    );
  });

  it("should return an internal server error if pubKey reservation fails", async () => {
    const req = mockReq();
    req.headers[LOLLIPOP_PUB_KEY_HEADER_NAME] = tokenizeJwk(aJwkPubKey);
    reservePubKeyMock.mockImplementationOnce(async () =>
      t.success(buildResponse(500, {}))
    );
    const result = await lollipopLoginHandler(true, lollipopApiClientMock)(req);
    expect(reservePubKeyMock).toHaveBeenCalledTimes(1);
    expect(reservePubKeyMock).toHaveBeenCalledWith({
      body: {
        algo: JwkPubKeyHashAlgorithmEnum.sha256,
        pub_key: aJwkPubKey
      }
    });

    expect(result).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorInternal",
        detail: "Internal server error: Cannot reserve pubKey"
      })
    );
  });

  it("should return an internal server error if pubKey reservation API is unreacheable", async () => {
    const req = mockReq();
    req.headers[LOLLIPOP_PUB_KEY_HEADER_NAME] = tokenizeJwk(aJwkPubKey);
    reservePubKeyMock.mockRejectedValueOnce("Network Error");
    const result = await lollipopLoginHandler(true, lollipopApiClientMock)(req);
    expect(reservePubKeyMock).toHaveBeenCalledTimes(1);
    expect(reservePubKeyMock).toHaveBeenCalledWith({
      body: {
        algo: JwkPubKeyHashAlgorithmEnum.sha256,
        pub_key: aJwkPubKey
      }
    });

    expect(result).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorInternal",
        detail: "Internal server error: Error while calling reservePubKey API"
      })
    );
  });

  it("should return a validation error if request is not well formed", async () => {
    const req = mockReq();
    req.headers[LOLLIPOP_PUB_KEY_HEADER_NAME] = "wrong jwk";
    const result = await lollipopLoginHandler(true, lollipopApiClientMock)(req);
    expect(reservePubKeyMock).not.toHaveBeenCalled();

    expect(result).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorValidation"
      })
    );
  });
});
