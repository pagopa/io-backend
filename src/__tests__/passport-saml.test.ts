/* tslint:disable:no-var-requires */
/* tslint:disable:no-any */

const saml = require("passport-saml").SAML;

// NotOnOrAfter has been set very far in the future to avoid a SAML assertion expired error.
const SAMLResponse = `<saml2:Assertion ID="_bc955ac99f151d87adbbdc1723a67019" IssueInstant="2018-04-10T14:36:36.724Z" Version="2.0"
                 xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <saml2:Issuer Format="urn:oasis:names:tc:SAML:2.0:nameid-format:entity">spid-testenv-identityserver</saml2:Issuer>
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:SignedInfo>
            <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
            <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
            <ds:Reference URI="#_bc955ac99f151d87adbbdc1723a67019">
                <ds:Transforms>
                    <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
                    <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#">
                        <ec:InclusiveNamespaces PrefixList="xs" xmlns:ec="http://www.w3.org/2001/10/xml-exc-c14n#"/>
                    </ds:Transform>
                </ds:Transforms>
                <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                <ds:DigestValue>MT9iID2qZfCvHDGuIi2PgHmB/cpj3FXQc6fL6oHEuFo=</ds:DigestValue>
            </ds:Reference>
        </ds:SignedInfo>
        <ds:SignatureValue>
            KuKsvQHTDEP7we5Zvzj432YvNOa80GP+cmYCb9EgNhiKXdkSm5/af3fe69mkZAQ4ft1xqQ8VPdNm
            oSRPrc9AIg/L0PpwrxcRmvB/OwsH+sl77LhIxdwyCFIYiroJzemlY5df1mq1O/U6hot7GYK461nK
            eSnBPWMCm0zmxij6v00=
        </ds:SignatureValue>
        <ds:KeyInfo>
            <ds:X509Data>
                <ds:X509Certificate>MIICNTCCAZ6gAwIBAgIES343gjANBgkqhkiG9w0BAQUFADBVMQswCQYDVQQGEwJVUzELMAkGA1UE
                    CAwCQ0ExFjAUBgNVBAcMDU1vdW50YWluIFZpZXcxDTALBgNVBAoMBFdTTzIxEjAQBgNVBAMMCWxv
                    Y2FsaG9zdDAeFw0xMDAyMTkwNzAyMjZaFw0zNTAyMTMwNzAyMjZaMFUxCzAJBgNVBAYTAlVTMQsw
                    CQYDVQQIDAJDQTEWMBQGA1UEBwwNTW91bnRhaW4gVmlldzENMAsGA1UECgwEV1NPMjESMBAGA1UE
                    AwwJbG9jYWxob3N0MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCUp/oV1vWc8/TkQSiAvTou
                    sMzOM4asB2iltr2QKozni5aVFu818MpOLZIr8LMnTzWllJvvaA5RAAdpbECb+48FjbBe0hseUdN5
                    HpwvnH/DW8ZccGvk53I6Orq7hLCv1ZHtuOCokghz/ATrhyPq+QktMfXnRS4HrKGJTzxaCcU7OQID
                    AQABoxIwEDAOBgNVHQ8BAf8EBAMCBPAwDQYJKoZIhvcNAQEFBQADgYEAW5wPR7cr1LAdq+IrR44i
                    QlRG5ITCZXY9hI0PygLP2rHANh+PYfTmxbuOnykNGyhM6FjFLbW2uZHQTY1jMrPprjOrmyK5sjJR
                    O4d1DeGHT/YnIjs9JogRKv4XHECwLtIVdAbIdWHEtVZJyMSktcyysFcvuhPQK8Qc/E/Wq8uHSCo=
                </ds:X509Certificate>
            </ds:X509Data>
        </ds:KeyInfo>
    </ds:Signature>
    <saml2:Subject>
        <saml2:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">ettore</saml2:NameID>
        <saml2:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
            <saml2:SubjectConfirmationData InResponseTo="_0ea514fbe21d21239033" NotOnOrAfter="2118-04-10T14:41:36.724Z"
                                           Recipient="http://italia-backend:81/assertionConsumerService"/>
        </saml2:SubjectConfirmation>
    </saml2:Subject>
    <saml2:Conditions NotBefore="2018-04-10T14:36:36.724Z" NotOnOrAfter="2118-04-10T14:41:36.724Z">
        <saml2:AudienceRestriction>
            <saml2:Audience>http://italia-backend</saml2:Audience>
        </saml2:AudienceRestriction>
    </saml2:Conditions>
    <saml2:AuthnStatement AuthnInstant="2018-04-10T14:36:36.724Z" SessionIndex="52641714-4ce0-4030-b6cf-091c423f8fd2">
        <saml2:AuthnContext>
            <saml2:AuthnContextClassRef>https://www.spid.gov.it/SpidL2</saml2:AuthnContextClassRef>
        </saml2:AuthnContext>
    </saml2:AuthnStatement>
    <saml2:AttributeStatement>
        <saml2:Attribute Name="familyName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
            <saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">
                Fieramosca
            </saml2:AttributeValue>
        </saml2:Attribute>
        <saml2:Attribute Name="name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
            <saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">Ettore
            </saml2:AttributeValue>
        </saml2:Attribute>
        <saml2:Attribute Name="fiscalNumber" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
            <saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">
                FRMTTR76M06B715E
            </saml2:AttributeValue>
        </saml2:Attribute>
        <saml2:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
            <saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">
                trediciitalianicontrotredicifrancesi@hotmail.com
            </saml2:AttributeValue>
        </saml2:Attribute>
    </saml2:AttributeStatement>
</saml2:Assertion>
`;

describe("passport-saml", () => {
  it("should extract the authnContextClassRef from the SAML response", () => {
    const spidOptions = {};
    const samlClient = new saml(spidOptions);

    samlClient.processValidlySignedAssertion(
      SAMLResponse,
      false,
      (err: any, user: any, message: any) => {
        expect(err).toBeNull();
        expect(message).toBeFalsy();
        expect(user.authnContextClassRef).toEqual(
          "https://www.spid.gov.it/SpidL2"
        );
      }
    );
  });
});
