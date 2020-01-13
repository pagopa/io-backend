/* tslint:disable:no-any */
/* tslint:disable:no-duplicate-string */
/* tslint:disable:no-let */
/* tslint:disable:no-identical-functions */
/* tslint:disable:no-big-function */
/* tslint:disable:no-object-mutation */

import { isRight, left, right } from "fp-ts/lib/Either";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { UrlFromString } from "italia-ts-commons/lib/url";
import * as lolex from "lolex";
import * as redis from "redis";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { NewProfile } from "../../../generated/io-api/NewProfile";

import {
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { UserIdentity } from "../../../generated/backend/UserIdentity";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClientFactory from "../../services/apiClientFactory";
import ProfileService from "../../services/profileService";
import RedisSessionStorage from "../../services/redisSessionStorage";
import TokenService from "../../services/tokenService";
import spidStrategy from "../../strategies/spidStrategy";
import { SessionToken, WalletToken } from "../../types/token";
import { exactUserIdentityDecode, User } from "../../types/user";
import AuthenticationController from "../authenticationController";

// saml configuration vars
const samlCert = `
-----BEGIN CERTIFICATE-----
MIIDczCCAlqgAwIBAgIBADANBgkqhkiG9w0BAQ0FADBTMQswCQYDVQQGEwJpdDEN
MAsGA1UECAwEUm9tZTEUMBIGA1UECgwLYWdpZC5nb3YuaXQxHzAdBgNVBAMMFmh0
dHBzOi8vaXRhbGlhLWJhY2tlbmQwHhcNMTcxMDI2MTAzNTQwWhcNMTgxMDI2MTAz
NTQwWjBTMQswCQYDVQQGEwJpdDENMAsGA1UECAwEUm9tZTEUMBIGA1UECgwLYWdp
ZC5nb3YuaXQxHzAdBgNVBAMMFmh0dHBzOi8vaXRhbGlhLWJhY2tlbmQwggEjMA0G
CSqGSIb3DQEBAQUAA4IBEAAwggELAoIBAgCXozdOvdlQhX2zyOvnpZJZWyhjmiRq
kBW7jkZHcmFRceeoVkXGn4bAFGGcqESFMVmaigTEm1c6gJpRojo75smqyWxngEk1
XLctn1+Qhb5SCbd2oHh0oLE5jpHyrxfxw8V+N2Hty26GavJE7i9jORbjeQCMkbgg
t0FahmlmaZr20akK8wNGMHDcpnMslJPxHl6uKxjAfe6sbNqjWxfcnirm05Jh5gYN
T4vkwC1vx6AZpS2G9pxOV1q5GapuvUBqwNu+EH1ufMRRXvu0+GtJ4WtsErOakSF4
KMezrMqKCrVPoK5SGxQMD/kwEQ8HfUPpim3cdi3RVmqQjsi/on6DMn/xTQIDAQAB
o1AwTjAdBgNVHQ4EFgQULOauBsRgsAudzlxzwEXYXd4uPyIwHwYDVR0jBBgwFoAU
LOauBsRgsAudzlxzwEXYXd4uPyIwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQ0F
AAOCAQIAQOT5nIiAefn8FAWiVYu2uEsHpxUQ/lKWn1Trnj7MyQW3QA/jNaJHL/Ep
szJ5GONOE0lVEG1on35kQOWR7qFWYhH9Llb8EAAAb5tbnCiA+WIx4wjRTE3CNLul
L8MoscacIc/rqWf5WygZQcPDX1yVxmK4F3YGG2qDTD3fr4wPweYHxn95JidTwzW8
Jv46ajSBvFJ95CoCYL3BUHaxPIlYkGbJFjQhuoxo2XM4iT6KFD4IGmdssS4NFgW+
OM+P8UsrYi2KZuyzSrHq5c0GJz0UzSs8cIDC/CPEajx2Uy+7TABwR4d20Hyo6WIm
IFJiDanROwzoG0YNd8aCWE8ZM2y81Ww=
-----END CERTIFICATE-----
`;
const samlKey = `
-----BEGIN PRIVATE KEY-----
MIIEwQIBADANBgkqhkiG9w0BAQEFAASCBKswggSnAgEAAoIBAgCXozdOvdlQhX2z
yOvnpZJZWyhjmiRqkBW7jkZHcmFRceeoVkXGn4bAFGGcqESFMVmaigTEm1c6gJpR
ojo75smqyWxngEk1XLctn1+Qhb5SCbd2oHh0oLE5jpHyrxfxw8V+N2Hty26GavJE
7i9jORbjeQCMkbggt0FahmlmaZr20akK8wNGMHDcpnMslJPxHl6uKxjAfe6sbNqj
Wxfcnirm05Jh5gYNT4vkwC1vx6AZpS2G9pxOV1q5GapuvUBqwNu+EH1ufMRRXvu0
+GtJ4WtsErOakSF4KMezrMqKCrVPoK5SGxQMD/kwEQ8HfUPpim3cdi3RVmqQjsi/
on6DMn/xTQIDAQABAoIBAWo61Yw8Q/m9CwrgPyPRQm2HBwx/9/MPbaovSdzTrIm6
Gmg7yDYVm/kETj3JQ/drUzKIbj6t9LXvUizOUa2VSMJ0yZTYsnDHuywi8nf0uhgO
5pAca0aJLJ792hEByOx+EeUSN3C3i35vfbn8gwYoAHjrVA8mJrAEsawRbdVpNj6j
IWAKTmsZK0YLdcNzWshSYW9wkJNykeXHUgKk2YzGUIacMgC+fF3v3xL82xk+eLez
dP5wlrzkPz8JKHMIomF5j/VLuggSZx0XdQRvZrkeQUbJqRy2iXa43B+OlEiNvd2Q
0AiXur/MhvID+Ni/hBIoeIDyvvoBoiCTZbVvyRnBds8BAoGBDIfqHTTcfXlzfipt
4+idRuuzzhIXzQOcB0+8ywqmgtE4g9EykC7fEcynOavv08rOSNSbYhjLX24xUSrd
19lckZIvH5U9nJxnyfwrMGrorCA2uPtck8N9sTB5UWif31w/eDVMv30jRUyMel7l
tp96zxcPThT1O3N4zM2Otk5q2DvFAoGBDBngF4G9dJ5a511dyYco2agMJTvJLIqn
kKw24KOTqZ5BZKyIea4yCy9cRmNN84ccOy3jBuzSFLNJMYqdDCzH46u0I4anft83
aqnVa4jOwjZXoV9JCdFh3zKJUgPU4CW0MaTb30n3U4BAOgkHzRFt55tGT6xRU1J+
jX5s03BFfQ/pAoGBCsRqtUfrweEvDRT2MeR56Cu153cCfoYAdwPcDHeNVlDih9mk
4eF0ib3ZXyPPQqQ8FrahAWyeq9Rqif0UfFloQiljVncNZtm6EQQeNE9YuDZB7zcF
eG59PViSlhIZdXq1itv5o3yqZux8tNV/+ykUBIgi/YvioH/7J7flTd8Zzc2lAoGB
CqdVNRzSETPBUGRQx7Yo7scWOkmSaZaAw8v6XHdm7zQW2m1Tkd0czeAaWxXecQKI
hkl10Ij6w6K8U9N3RFrAeN6YL5bDK92VSmDPNmcxsKZrK/VZtj0S74/sebpJ1jUb
mYFM2h6ikm8dHHsK1S39FqULl+VbjAHazPN7GAOGCf7RAoGBAc0J9j+MHYm4M18K
AW2UB26qvdc8PSXE6i4YQAsg2RBgtf6u4jVAQ8a8OA4vnGG9VIrR0bD/hFTfczg/
ZbWGZ+42VH2eDGouiadR4rWzJNQKjWd98Y5PzxdEjd6nneJ68iNqGbKOT6jXu8qj
nCnxP/vK5rgVHU3nQfq+e/B6FVWZ
-----END PRIVATE KEY-----
`;
const samlCallbackUrl = "http://italia-backend/assertionConsumerService";
const samlIssuer = "https://spid.agid.gov.it/cd";
const samlAcceptedClockSkewMs = -1;
const samlAttributeConsumingServiceIndex = 0;
const spidAutologin = "";
const spidTestEnvUrl = "https://localhost:8088";

// user constant
const aTimestamp = 1518010929530;

const theCurrentTimestampMillis = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidname = "Giuseppe Maria";
const aValidsurname = "Garibaldi";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// authentication constant
const mockSessionToken =
  "c77de47586c841adbd1a1caeb90dce25dcecebed620488a4f932a6280b10ee99a77b6c494a8a6e6884ccbeb6d3fe736b";
const mockWalletToken =
  "5ba5b99a982da1aa5eb4fd8643124474fa17ee3016c13c617ab79d2e7c8624bb80105c0c0cae9864e035a0d31a715043";

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: aValidsurname,
  fiscal_code: aFiscalNumber,
  name: aValidname,
  session_token: mockSessionToken as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: mockWalletToken as WalletToken
};

// validUser has all every field correctly set.
const validUserPayload = {
  authnContextClassRef: aValidSpidLevel,
  email: anEmailAddress,
  familyName: aValidsurname,
  fiscalNumber: aFiscalNumber,
  getAssertionXml: () => "",
  issuer: {
    _: "xxx"
  },
  mobilePhone: "3222222222222",
  name: aValidname
};
// invalidUser lacks the required familyName and optional email fields.
const invalidUserPayload = {
  authnContextClassRef: aValidSpidLevel,
  fiscalNumber: aFiscalNumber,
  getAssertionXml: () => "",
  issuer: {
    _: "xxx"
  },
  mobilePhone: "3222222222222",
  name: aValidname
};

const proxyInitializedProfileResponse = {
  blocked_inbox_or_channels: undefined,
  email: anEmailAddress,
  family_name: aValidsurname,
  fiscal_code: aFiscalNumber,
  has_profile: true,
  is_inbox_enabled: true,
  is_webhook_enabled: true,
  name: aValidname,
  preferred_languages: ["it_IT"],
  spid_email: anEmailAddress,
  spid_mobile_phone: "3222222222222",
  version: 42
};

const anErrorResponse = {
  detail: undefined,
  status: 500,
  title: "Internal server error",
  type: undefined
};

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

const mockSet = jest.fn();
const mockGetBySessionToken = jest.fn();
const mockGetByWalletToken = jest.fn();
const mockDel = jest.fn();
jest.mock("../../services/redisSessionStorage", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      del: mockDel,
      getBySessionToken: mockGetBySessionToken,
      getByWalletToken: mockGetByWalletToken,
      set: mockSet
    }))
  };
});

const mockGetNewToken = jest.fn();
jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getNewToken: mockGetNewToken
    }))
  };
});

const mockGetProfile = jest.fn();
const mockCreateProfile = jest.fn();

jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      createProfile: mockCreateProfile,
      getProfile: mockGetProfile
    }))
  };
});

const redisClient = {} as redis.RedisClient;

const tokenService = new TokenService();
const allowMultipleSessions = false;
const tokenDurationSecs = 0;
const redisSessionStorage = new RedisSessionStorage(
  redisClient,
  tokenDurationSecs,
  allowMultipleSessions
);

const getClientProfileRedirectionUrl = (token: string): UrlFromString => {
  const url = "/profile.html?token={token}".replace("{token}", token);

  return {
    href: url
  };
};

let controller: AuthenticationController;
beforeAll(async () => {
  const IDPMetadataUrl =
    process.env.IDP_METADATA_URL ||
    "https://raw.githubusercontent.com/teamdigitale/io-backend/164984224-download-idp-metadata/test_idps/spid-entities-idps.xml";
  const spidStrategyInstance = await spidStrategy(
    samlKey,
    samlCert,
    samlCallbackUrl,
    samlIssuer,
    samlAcceptedClockSkewMs,
    samlAttributeConsumingServiceIndex,
    spidAutologin,
    spidTestEnvUrl,
    IDPMetadataUrl,
    false
  );
  spidStrategyInstance.logout = jest.fn();

  const api = new ApiClientFactory("", "");
  const service = new ProfileService(api);

  controller = new AuthenticationController(
    redisSessionStorage,
    samlCert,
    spidStrategyInstance,
    tokenService,
    getClientProfileRedirectionUrl,
    service
  );
});

let clock: any;
beforeEach(() => {
  // We need to mock time to test token expiration.
  clock = lolex.install({ now: theCurrentTimestampMillis });

  jest.clearAllMocks();
});
afterEach(() => {
  clock = clock.uninstall();
});

describe("AuthenticationController#acs", () => {
  it("redirects to the correct url if userPayload is a valid User and a profile not exists", async () => {
    const res = mockRes();
    const expectedNewProfile: NewProfile = {
      email: validUserPayload.email,
      is_email_validated: true
    };

    mockSet.mockReturnValue(Promise.resolve(right(true)));

    mockGetNewToken
      .mockReturnValueOnce(mockSessionToken)
      .mockReturnValueOnce(mockWalletToken);

    mockGetProfile.mockReturnValue(
      ResponseErrorNotFound("Not Found.", "Profile not found")
    );
    mockCreateProfile.mockReturnValue(
      ResponseSuccessJson(proxyInitializedProfileResponse)
    );
    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      "/profile.html?token=" + mockSessionToken
    );
    expect(mockSet).toHaveBeenCalledWith(mockedUser);
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).toHaveBeenCalledWith(
      mockedUser,
      expectedNewProfile
    );
  });

  it("redirects to the correct url if userPayload is a valid User and a profile exists", async () => {
    const res = mockRes();

    mockSet.mockReturnValue(Promise.resolve(right(true)));

    mockGetNewToken
      .mockReturnValueOnce(mockSessionToken)
      .mockReturnValueOnce(mockWalletToken);

    mockGetProfile.mockReturnValue(
      ResponseSuccessJson(proxyInitializedProfileResponse)
    );
    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      "/profile.html?token=" + mockSessionToken
    );
    expect(mockSet).toHaveBeenCalledWith(mockedUser);
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).not.toBeCalled();
  });

  it("should fail if a profile cannot be created", async () => {
    const res = mockRes();
    const expectedNewProfile: NewProfile = {
      email: validUserPayload.email,
      is_email_validated: true
    };

    mockSet.mockReturnValue(Promise.resolve(right(true)));

    mockGetNewToken
      .mockReturnValueOnce(mockSessionToken)
      .mockReturnValueOnce(mockWalletToken);

    mockGetProfile.mockReturnValue(
      ResponseErrorNotFound("Not Found.", "Profile not found")
    );
    mockCreateProfile.mockReturnValue(
      ResponseErrorInternal("Error creating new user profile")
    );
    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockSet).toHaveBeenCalledWith(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).toHaveBeenCalledWith(
      mockedUser,
      expectedNewProfile
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error creating new user profile"
    });
  });

  it("should fail if an error occours checking the profile", async () => {
    const res = mockRes();

    mockSet.mockReturnValue(Promise.resolve(right(true)));

    mockGetNewToken
      .mockReturnValueOnce(mockSessionToken)
      .mockReturnValueOnce(mockWalletToken);

    mockGetProfile.mockReturnValue(
      ResponseErrorInternal("Error reading the user profile")
    );
    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockSet).toHaveBeenCalledWith(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error reading the user profile"
    });
  });

  it("should fail if userPayload is invalid", async () => {
    const res = mockRes();

    const response = await controller.acs(invalidUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("should fail if the session can not be saved", async () => {
    mockSet.mockReturnValue(Promise.resolve(right(false)));
    const res = mockRes();

    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error creating the user session"
    });
  });

  it("should fail if Redis client returns an error", async () => {
    mockSet.mockReturnValue(Promise.resolve(left(new Error("Redis error"))));
    const res = mockRes();

    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Redis error"
    });
  });
});

describe("AuthenticationController#getUserIdentity", () => {
  let mockUserDecode: jest.Mock | undefined;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterEach(() => {
    if (mockUserDecode !== undefined) {
      mockUserDecode.mockRestore();
    }
  });

  it("shoud return a success response with the User Identity", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    const response = await controller.getUserIdentity(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    /* tslint:disable-next-line:no-useless-cast */
    const expectedValue = exactUserIdentityDecode(mockedUser as UserIdentity);
    expect(isRight(expectedValue)).toBeTruthy();
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: expectedValue.value
    });
  });

  it("should fail if the User object doesn't match UserIdentity decoder contraints", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = invalidUserPayload;

    // Emulate a successfully User decode and a failure on UserIdentity decode
    const user = require("../../types/user").User;
    mockUserDecode = jest
      .spyOn(user, "decode")
      .mockImplementation((_: unknown) => right(_));

    const response = await controller.getUserIdentity(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: "Internal server error: Unexpected User Identity data format.",
      kind: "IResponseErrorInternal"
    });
  });
});

describe("AuthenticationController#slo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to the home page", async () => {
    const res = mockRes();

    const response = await controller.slo();
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.redirect).toHaveBeenCalledWith(301, "/");
  });
});

describe("AuthenticationController#logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it("shoud return success after deleting the session token", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockDel.mockReturnValue(Promise.resolve(right(true)));

    const response = await controller.logout(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockDel).toHaveBeenCalledWith(mockSessionToken, mockWalletToken);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
  });

  it("should fail if the generation user data is invalid", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = invalidUserPayload;

    const response = await controller.logout(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockDel).not.toBeCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should fail if the session can not be destroyed", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;
    mockDel.mockReturnValue(Promise.resolve(right(false)));

    const response = await controller.logout(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error destroying the user session"
    });
  });

  it("should fail if Redis client returns an error", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;
    mockDel.mockReturnValue(Promise.resolve(left(new Error("Redis error"))));

    const response = await controller.logout(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Redis error"
    });
  });
});

describe("AuthenticationController#metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the correct metadata", async () => {
    const res = mockRes();
    const response = `<?xml version="1.0"?><EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="https://spid.agid.gov.it/cd" ID="https___spid_agid_gov_it_cd"><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><Reference URI="#https___spid_agid_gov_it_cd"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><DigestValue>mfxo77RIibQ+NPeF9lAITMWfMXLfH6JuctAgKROxzZk=</DigestValue></Reference></SignedInfo><SignatureValue>CKivnvnXQnN8VhZdI+MEkW+0j3uxZ48pCEBIlPzGtZ+YSPxUXwXixePNE6QQ7VJZNg2BnWarB/HW21rhzfUQjaAOocG1t1b7vYtL7/SBGJt8a8A0zZxr9Ru38y3q3TSkVmEjnNXQ+jM2NfcWBbR9cKA2SXg/+76EBsIxq1zhPctSxyDb9aHrP9EuUqweZzC+1NaUOLQg0CxAOH+OxNlvi4bxbs5nzRN2KQzHZhRld/0jwssiDgLlw1VP5rIe4FZiGxazI5PD5Tvact7qIQD2myMNpE4NTm+imibLTQLBNayEqoONGKaJOYgbMg3aC2G7pYCJaflc/ub55fKy5YVWlYc=</SignatureValue><KeyInfo><X509Data><X509Certificate>
MIIDczCCAlqgAwIBAgIBADANBgkqhkiG9w0BAQ0FADBTMQswCQYDVQQGEwJpdDEN
MAsGA1UECAwEUm9tZTEUMBIGA1UECgwLYWdpZC5nb3YuaXQxHzAdBgNVBAMMFmh0
dHBzOi8vaXRhbGlhLWJhY2tlbmQwHhcNMTcxMDI2MTAzNTQwWhcNMTgxMDI2MTAz
NTQwWjBTMQswCQYDVQQGEwJpdDENMAsGA1UECAwEUm9tZTEUMBIGA1UECgwLYWdp
ZC5nb3YuaXQxHzAdBgNVBAMMFmh0dHBzOi8vaXRhbGlhLWJhY2tlbmQwggEjMA0G
CSqGSIb3DQEBAQUAA4IBEAAwggELAoIBAgCXozdOvdlQhX2zyOvnpZJZWyhjmiRq
kBW7jkZHcmFRceeoVkXGn4bAFGGcqESFMVmaigTEm1c6gJpRojo75smqyWxngEk1
XLctn1+Qhb5SCbd2oHh0oLE5jpHyrxfxw8V+N2Hty26GavJE7i9jORbjeQCMkbgg
t0FahmlmaZr20akK8wNGMHDcpnMslJPxHl6uKxjAfe6sbNqjWxfcnirm05Jh5gYN
T4vkwC1vx6AZpS2G9pxOV1q5GapuvUBqwNu+EH1ufMRRXvu0+GtJ4WtsErOakSF4
KMezrMqKCrVPoK5SGxQMD/kwEQ8HfUPpim3cdi3RVmqQjsi/on6DMn/xTQIDAQAB
o1AwTjAdBgNVHQ4EFgQULOauBsRgsAudzlxzwEXYXd4uPyIwHwYDVR0jBBgwFoAU
LOauBsRgsAudzlxzwEXYXd4uPyIwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQ0F
AAOCAQIAQOT5nIiAefn8FAWiVYu2uEsHpxUQ/lKWn1Trnj7MyQW3QA/jNaJHL/Ep
szJ5GONOE0lVEG1on35kQOWR7qFWYhH9Llb8EAAAb5tbnCiA+WIx4wjRTE3CNLul
L8MoscacIc/rqWf5WygZQcPDX1yVxmK4F3YGG2qDTD3fr4wPweYHxn95JidTwzW8
Jv46ajSBvFJ95CoCYL3BUHaxPIlYkGbJFjQhuoxo2XM4iT6KFD4IGmdssS4NFgW+
OM+P8UsrYi2KZuyzSrHq5c0GJz0UzSs8cIDC/CPEajx2Uy+7TABwR4d20Hyo6WIm
IFJiDanROwzoG0YNd8aCWE8ZM2y81Ww=
</X509Certificate></X509Data></KeyInfo></Signature>
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" AuthnRequestsSigned="true" WantAssertionsSigned="true">
    <KeyDescriptor use="signing">
      <ds:KeyInfo>
        <ds:X509Data>
          <ds:X509Certificate>
MIIDczCCAlqgAwIBAgIBADANBgkqhkiG9w0BAQ0FADBTMQswCQYDVQQGEwJpdDEN
MAsGA1UECAwEUm9tZTEUMBIGA1UECgwLYWdpZC5nb3YuaXQxHzAdBgNVBAMMFmh0
dHBzOi8vaXRhbGlhLWJhY2tlbmQwHhcNMTcxMDI2MTAzNTQwWhcNMTgxMDI2MTAz
NTQwWjBTMQswCQYDVQQGEwJpdDENMAsGA1UECAwEUm9tZTEUMBIGA1UECgwLYWdp
ZC5nb3YuaXQxHzAdBgNVBAMMFmh0dHBzOi8vaXRhbGlhLWJhY2tlbmQwggEjMA0G
CSqGSIb3DQEBAQUAA4IBEAAwggELAoIBAgCXozdOvdlQhX2zyOvnpZJZWyhjmiRq
kBW7jkZHcmFRceeoVkXGn4bAFGGcqESFMVmaigTEm1c6gJpRojo75smqyWxngEk1
XLctn1+Qhb5SCbd2oHh0oLE5jpHyrxfxw8V+N2Hty26GavJE7i9jORbjeQCMkbgg
t0FahmlmaZr20akK8wNGMHDcpnMslJPxHl6uKxjAfe6sbNqjWxfcnirm05Jh5gYN
T4vkwC1vx6AZpS2G9pxOV1q5GapuvUBqwNu+EH1ufMRRXvu0+GtJ4WtsErOakSF4
KMezrMqKCrVPoK5SGxQMD/kwEQ8HfUPpim3cdi3RVmqQjsi/on6DMn/xTQIDAQAB
o1AwTjAdBgNVHQ4EFgQULOauBsRgsAudzlxzwEXYXd4uPyIwHwYDVR0jBBgwFoAU
LOauBsRgsAudzlxzwEXYXd4uPyIwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQ0F
AAOCAQIAQOT5nIiAefn8FAWiVYu2uEsHpxUQ/lKWn1Trnj7MyQW3QA/jNaJHL/Ep
szJ5GONOE0lVEG1on35kQOWR7qFWYhH9Llb8EAAAb5tbnCiA+WIx4wjRTE3CNLul
L8MoscacIc/rqWf5WygZQcPDX1yVxmK4F3YGG2qDTD3fr4wPweYHxn95JidTwzW8
Jv46ajSBvFJ95CoCYL3BUHaxPIlYkGbJFjQhuoxo2XM4iT6KFD4IGmdssS4NFgW+
OM+P8UsrYi2KZuyzSrHq5c0GJz0UzSs8cIDC/CPEajx2Uy+7TABwR4d20Hyo6WIm
IFJiDanROwzoG0YNd8aCWE8ZM2y81Ww=
</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
      <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes256-cbc"/>
      <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"/>
      <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#tripledes-cbc"/>
    </KeyDescriptor>
    <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</NameIDFormat>
    <AssertionConsumerService index="0" isDefault="true" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="http://italia-backend/assertionConsumerService"/>
    <AttributeConsumingService index="0">
      <ServiceName xml:lang="it">Required attributes</ServiceName>
      <RequestedAttribute Name="fiscalNumber" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" FriendlyName="Codice fiscale"/>
      <RequestedAttribute Name="name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" FriendlyName="Nome"/>
      <RequestedAttribute Name="familyName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" FriendlyName="Cognome"/>
      <RequestedAttribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" FriendlyName="Email"/>
      <RequestedAttribute Name="mobilePhone" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" FriendlyName="Numero di telefono"/>
    </AttributeConsumingService>
  </SPSSODescriptor>
  <Organization>
    <OrganizationName xml:lang="it">Team per la Trasformazione Digitale - Presidenza Del Consiglio dei Ministri</OrganizationName>
    <OrganizationDisplayName xml:lang="it">IO - l'app dei servizi pubblici BETA</OrganizationDisplayName>
    <OrganizationURL xml:lang="it">https://io.italia.it</OrganizationURL>
  </Organization>
</EntityDescriptor>`;

    const metadata = await controller.metadata();
    metadata.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(response);
  });
});
