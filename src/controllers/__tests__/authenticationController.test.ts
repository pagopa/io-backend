// tslint:disable:no-any

import * as lolex from "lolex";
import * as redis from "redis";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import RedisSessionStorage from "../../services/redisSessionStorage";
import TokenService from "../../services/tokenService";
import spidStrategy from "../../strategies/spidStrategy";
import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { User } from "../../types/user";
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
const samlIssuer = "http://italia-backend";
const samlAttributeConsumingServiceIndex = 0;

// user constant
const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;

// authentication constant
const mockToken =
  "c77de47586c841adbd1a1caeb90dce25dcecebed620488a4f932a6280b10ee99a77b6c494a8a6e6884ccbeb6d3fe736b";

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferred_email: anEmailAddress,
  sessionIndex: "123sessionIndex",
  spid_idp: "xxx",
  token: mockToken
};

// validUser has all every field correctly set.
const validUserPayload = {
  email: anEmailAddress,
  familyName: "Garibaldi",
  fiscalNumber: aFiscalNumber,
  issuer: {
    _: "xxx"
  },
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  sessionIndex: "123sessionIndex"
};
// invalidUser lacks the required email field.
const invalidUserPayload = {
  familyName: "Garibaldi",
  fiscalNumber: aFiscalNumber,
  issuer: {
    _: "xxx"
  },
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  sessionIndex: "123sessionIndex"
};

const mockSet = jest.fn();
const mockGet = jest.fn();
const mockDel = jest.fn();
jest.mock("../../services/redisSessionStorage", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      del: mockDel,
      get: mockGet,
      set: mockSet
    }))
  };
});

jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getNewToken: jest.fn(() => {
        return mockToken;
      })
    }))
  };
});

const redisClient = {} as redis.RedisClient;

const tokenService = new TokenService();
const redisSessionStorage = new RedisSessionStorage(redisClient, 0);

const spidStrategyInstance = spidStrategy(
  samlKey,
  samlCallbackUrl,
  samlIssuer,
  samlAttributeConsumingServiceIndex
);
spidStrategyInstance.logout = jest.fn();

const controller = new AuthenticationController(
  redisSessionStorage,
  samlCert,
  spidStrategyInstance,
  tokenService
);

describe("AuthenticationController#acs", () => {
  // tslint:disable-next-line:no-let
  let clock: any;

  beforeEach(() => {
    // toUser() saves the current timestamp into the User object, we need to
    // mock time.
    clock = lolex.install({ now: aTimestamp });

    jest.clearAllMocks();
  });
  afterEach(() => {
    clock = clock.uninstall();
  });

  it("redirects to the correct url if userPayload is a valid User", () => {
    const res = mockRes() as any;

    controller.acs(validUserPayload, res);

    expect(controller).toBeTruthy();
    expect(res.redirect).toHaveBeenCalledWith(
      "/profile.html?token=" + mockToken
    );
    expect(mockSet).toHaveBeenCalledWith(mockToken, mockedUser);
  });

  it("return an error if userPayload is invalid", () => {
    const res = mockRes() as any;

    controller.acs(invalidUserPayload, res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockSet).not.toHaveBeenCalled();
  });
});

describe("AuthenticationController#slo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to the home page", () => {
    const res = mockRes() as any;

    controller.slo(res);

    expect(controller).toBeTruthy();
    expect(res.redirect).toHaveBeenCalledWith("/");
  });
});

describe("AuthenticationController#logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it("extracts the logout url", () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    spidStrategyInstance.logout.mockImplementation((_: any, callback: any) => {
      callback(undefined, "http://www.example.com");
    });

    req.user = mockedUser;

    controller.logout(req, res);

    expect(controller).toBeTruthy();
    expect(mockDel).toHaveBeenCalledWith(mockToken);
    expect(spidStrategyInstance.logout.mock.calls[0][0]).toBe(req);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      logoutUrl: "http://www.example.com"
    });
  });

  it("returns error if the generation user data is invalid", () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    req.user = invalidUserPayload;

    controller.logout(req, res);

    expect(controller).toBeTruthy();
    expect(mockDel).not.toBeCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unable to decode the user"
    });
  });

  it("returns error if the generation of logout fails", () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    spidStrategyInstance.logout.mockImplementation(
      (_: any, callback: (error: Error) => void) => {
        callback(new Error("Error message"));
      }
    );

    req.user = mockedUser;

    controller.logout(req, res);

    expect(controller).toBeTruthy();
    expect(mockDel).toHaveBeenCalledWith(mockToken);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error: Error message"
    });
  });
});

describe("AuthenticationController#metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the correct metadata", () => {
    const res = mockRes() as any;
    const response = `<?xml version="1.0"?><EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="http://italia-backend" ID="http___italia_backend">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" AuthnRequestsSigned="true" WantAssertionsSigned="true">
    <KeyDescriptor>
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
      <RequestedAttribute Name="fiscalNumber" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified" FriendlyName="Codice fiscale"/>
      <RequestedAttribute Name="name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified" FriendlyName="Nome"/>
      <RequestedAttribute Name="familyName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified" FriendlyName="Cognome"/>
      <RequestedAttribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified" FriendlyName="Email"/>
    </AttributeConsumingService>
  </SPSSODescriptor>
  <Organization>
    <OrganizationName>Digital citizenship proxy</OrganizationName>
    <OrganizationDisplayName>Digital citizenship proxy</OrganizationDisplayName>
    <OrganizationURL>https://github.com/teamdigitale/italia-backend</OrganizationURL>
  </Organization>
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><Reference URI="#http___italia_backend"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><DigestValue>Mh1V7fJl+pMthhcJAAhEBuY58dWxqd3NI2ha/JyPpeI=</DigestValue></Reference></SignedInfo><SignatureValue>SIzSS+ZwK00YtvsXR8odCkrkBapatSdy8n4ifLl0/zoRQM7UCPrSKbUWihMBJCe7HdoT4VXOhhhgo9+IdE1qunrxQ1a3ydQbySRAidtaGbOQf5JxfzH0zYcKCQJLRPMXtLBNL3qlt+np0Bf740ZpzaKHRktaRn/0yKEHEtE9khf8d2xuzIm/fw75L2/i7wSggNFSUBzwSGd8EN3XRFWgwUuIwP6NK8GAjZa7pO0sZ0Z2zqCL1Q75/FZqaRBqvkrGDmlVu7wRJDTY6WSlzQ7PdhrLyGb4pxjWER0SfnKJBskS9SVjPP9ypb/AoQB6zoFX/58NtDUaluBr3jgxvWLH5R4=</SignatureValue><KeyInfo><X509Data><X509Certificate>
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
</X509Certificate></X509Data></KeyInfo></Signature></EntityDescriptor>`;

    controller.metadata(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(response);
  });
});
