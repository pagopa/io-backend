import { getSamlIssuer, SAMLResponse } from "../saml";

const expectedSamlIssuer = "https://spid-testenv2:8088";
const samlResponse = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
InResponseTo="_9bad655901bc9f88fd14" ID="id_37f3386d61fe59a4258d848eb79e2f032c3345d8"
Destination="https://italia-backend/assertionConsumerService" Version="2.0"
IssueInstant="2019-09-20T08:43:15Z">
    <samlp:Status>
        <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:AuthnFailed"/>
        <samlp:StatusMessage>ErrorCode nr22</samlp:StatusMessage>
    </samlp:Status>
    <saml:Issuer
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xs="http://www.w3.org/2001/XMLSchema"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" NameQualifier="something"
        Format="urn:oasis:names:tc:SAML:2.0:nameid-format:entity">${expectedSamlIssuer}</saml:Issuer>
</samlp:Response>`;

const noIssuerSamlResponse = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
InResponseTo="_9bad655901bc9f88fd14" ID="id_37f3386d61fe59a4258d848eb79e2f032c3345d8"
Destination="https://italia-backend/assertionConsumerService" Version="2.0"
IssueInstant="2019-09-20T08:43:15Z">
    <samlp:Status>
        <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:AuthnFailed"/>
        <samlp:StatusMessage>ErrorCode nr22</samlp:StatusMessage>
    </samlp:Status>
</samlp:Response>`;

describe("Get Issuer from saml Response", () => {
  it("should get the expected saml issuer", () => {
    const body: SAMLResponse = {
      SAMLResponse: Buffer.from(samlResponse).toString("base64")
    };
    const issuer = getSamlIssuer(body);
    expect(issuer).toBe(expectedSamlIssuer);
  });

  it("should return UNKNOWN if saml response is invalid", () => {
    const body: unknown = {
      SAMLResponse: ""
    };
    const issuer = getSamlIssuer(body);
    expect(issuer).toBe("UNKNOWN");
  });

  it("should return UNKNOWN if saml response is missing", () => {
    const body: unknown = {
      RelayState: ""
    };
    const issuer = getSamlIssuer(body);
    expect(issuer).toBe("UNKNOWN");
  });

  it("should return UNKNOWN if saml issuer is missing", () => {
    const body: SAMLResponse = {
      SAMLResponse: Buffer.from(noIssuerSamlResponse).toString("base64")
    };
    const issuer = getSamlIssuer(body);
    expect(issuer).toBe("UNKNOWN");
  });
});
