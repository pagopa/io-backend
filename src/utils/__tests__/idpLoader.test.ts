import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";
import { IDPOption, mapIpdMetadata, parseIdpMetadata } from "../idpLoader";

const mockMetadata = `
<?xml version="1.0" encoding="UTF-8" standalone="no"?><md:EntitiesDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ID="_34aadd11-e3d9-4311-a410-4039de088446" Name="https://idps.spid.gov.it"><ds:Signature>
<ds:SignedInfo>
<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
<ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
<ds:Reference URI="#_34aadd11-e3d9-4311-a410-4039de088446">
<ds:Transforms>
<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
<ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
</ds:Transforms>
<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
<ds:DigestValue>hCIkzc0YP+EJj/cJM116xnvDOF+TRmW2q4eH/NdxFqg=</ds:DigestValue>
</ds:Reference>
</ds:SignedInfo>
<ds:SignatureValue>
3AM3/CXf6xj412sj7GDLP2cOrV+jLdV7HUBCPxX4jUstlpY96PzQLXbsmdpfqdMsG5BcwAWL39Xs
UBeBQE5c6DMDr4qXHturcSce8ZN4bYVk/zQYg8W0xIHNnjA2EX/gEN6s+x474Keiq0+UVBxJHa98
zTwcnJvJzSQ8+5u9OblmzNg9DFGv6IEmoKmdWVbxywv6d5k3dYDfCM8ZCaqFXLdfNKHB74g7YaOq
k8rC5oWaW1MvggsW8aflALswnlohW7Yyrnt+NI5HxLIHdqo13HLXq3LfbgWEqxuBB9eHZqX1bXB6
ugc1VDHVSSIblsbYBIs7H2owXTBTBH57OYXUxQ==
</ds:SignatureValue>
<ds:KeyInfo>
<ds:KeyValue>
<ds:RSAKeyValue>
<ds:Modulus>
4HVbuVj/NajswD7LrDXg73FRxtFrTJZkIBrnxCt6NzhWAOdH2DjQ0qjDoY6XIGPMyTI5YLGCZhDY
6g8jEh4yKsz2bLGvkz4rYzqODqkYJZysoYgnZ8oPdYkJON+2oqGewarcbXeeO1eKUNnbU8IzPffr
Sb4LReFOQpUrvUjFcjTkIyBYoxR79SGjCtlLuL55FpY4+N4/IOjVkiZcPudhbFhYY8G7yFFOsXgW
lqB5RBCzMtmcIQeamWJkWb/Z8K4MnPjhBAuJoMf5fSRLrsmQlcjSnFGAY97lAxFnySb/mmtGoFh1
1aFEsi3WihlMpoTfHuVin1o2P4KAg+3yN5kgrw==
</ds:Modulus>
<ds:Exponent>AQAB</ds:Exponent>
</ds:RSAKeyValue>
</ds:KeyValue>
<ds:X509Data>
<ds:X509Certificate>
MIIDjDCCAnQCCQDrwdpdNHQoozANBgkqhkiG9w0BAQsFADCBhzELMAkGA1UEBhMCSVQxDTALBgNV
BAgMBFJvbWExDTALBgNVBAcMBFJvbWExDTALBgNVBAoMBEFnSUQxDTALBgNVBAsMBFNQSUQxGTAX
BgNVBAMMEHNwaWQuYWdpZC5nb3YuaXQxITAfBgkqhkiG9w0BCQEWEnJvc2luaUBhZ2lkLmdvdi5p
dDAeFw0xODEyMjExNTE5NTdaFw0xOTEyMjExNTE5NTdaMIGHMQswCQYDVQQGEwJJVDENMAsGA1UE
CAwEUm9tYTENMAsGA1UEBwwEUm9tYTENMAsGA1UECgwEQWdJRDENMAsGA1UECwwEU1BJRDEZMBcG
A1UEAwwQc3BpZC5hZ2lkLmdvdi5pdDEhMB8GCSqGSIb3DQEJARYScm9zaW5pQGFnaWQuZ292Lml0
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4HVbuVj/NajswD7LrDXg73FRxtFrTJZk
IBrnxCt6NzhWAOdH2DjQ0qjDoY6XIGPMyTI5YLGCZhDY6g8jEh4yKsz2bLGvkz4rYzqODqkYJZys
oYgnZ8oPdYkJON+2oqGewarcbXeeO1eKUNnbU8IzPffrSb4LReFOQpUrvUjFcjTkIyBYoxR79SGj
CtlLuL55FpY4+N4/IOjVkiZcPudhbFhYY8G7yFFOsXgWlqB5RBCzMtmcIQeamWJkWb/Z8K4MnPjh
BAuJoMf5fSRLrsmQlcjSnFGAY97lAxFnySb/mmtGoFh11aFEsi3WihlMpoTfHuVin1o2P4KAg+3y
N5kgrwIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQCVgOxgPxVQhqzKTmBPMcTFQph4LWo89tAACR44
oXvMqT5u1Qyi8cpYu7IOg3VWYMgsoTxExXC4sicWfQJa+aGBtSXv4jB1ZQ7HEXaJxVQuguahJBwQ
5Y61ebWyNmiUPySbRNbpQlinL8ulTjE6uPSSydMvleOxpF9uyUH7gLvzfgkovLr8MZtNCNUaEfJs
Youdvxtwmpv1yKvvkGpExGK99fsp60mHHdQDsbRq9ymH8GzY8vmbVVK63QFYdG5aJdGg8sCA/0th
lMDbdL6Ec/0xAljQSOFpozFduGoYTKF6Ig2Z5NleHPuYVyWLmBhw0lGfyvKGyk9Ev55WxTwHapQB
</ds:X509Certificate>
</ds:X509Data>
</ds:KeyInfo>
</ds:Signature>
<!-- POSTE ID *start* -->
<md:EntityDescriptor ID="_c29324e5-416c-43d2-b7ba-baf3d7b18800" cacheDuration="P0Y0M30DT0H0M0.000S" entityID="https://posteid.poste.it">
    <md:IDPSSODescriptor WantAuthnRequestsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <md:KeyDescriptor use="signing">
            <ds:KeyInfo>
                <ds:X509Data>
                    <ds:X509Certificate>MIIEKzCCAxOgAwIBAgIDE2Y0MA0GCSqGSIb3DQEBCwUAMGAxCzAJBgNVBAYTAklUMRgwFgYDVQQK
                        DA9Qb3N0ZWNvbSBTLnAuQS4xIDAeBgNVBAsMF0NlcnRpZmljYXRpb24gQXV0aG9yaXR5MRUwEwYD
                        VQQDDAxQb3N0ZWNvbSBDQTMwHhcNMTYwMjI2MTU1MjQ0WhcNMjEwMjI2MTU1MjQ0WjBxMQswCQYD
                        VQQGEwJJVDEOMAwGA1UECAwFSXRhbHkxDTALBgNVBAcMBFJvbWUxHjAcBgNVBAoMFVBvc3RlIEl0
                        YWxpYW5lIFMucC5BLjENMAsGA1UECwwEU1BJRDEUMBIGA1UEAwwLSURQLVBvc3RlSUQwggEiMA0G
                        CSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDZFEtJoEHFAjpCaZcj5DVWrRDyaLZyu31XApslbo87
                        CyWz61OJMtw6QQU0MdCtrYbtSJ6vJwx7/6EUjsZ3u4x3EPLdlkyiGOqukPwATv4c7TVOUVs5onIq
                        TphM9b+AHRg4ehiMGesm/9d7RIaLuN79iPUvdLn6WP3idAfEw+rhJ/wYEQ0h1Xm5osNUgtWcBGav
                        ZIjLssWNrDDfJYxXH3QZ0kI6feEvLCJwgjXLGkBuhFehNhM4fhbX9iUCWwwkJ3JsP2++Rc/iTA0L
                        ZhiUsXNNq7gBcLAJ9UX2V1dWjTzBHevfHspzt4e0VgIIwbDRqsRtF8VUPSDYYbLoqwbLt18XAgMB
                        AAGjgdwwgdkwRgYDVR0gBD8wPTAwBgcrTAsBAgEBMCUwIwYIKwYBBQUHAgEWF2h0dHA6Ly93d3cu
                        cG9zdGVjZXJ0Lml0MAkGBytMCwEBCgIwDgYDVR0PAQH/BAQDAgSwMB8GA1UdIwQYMBaAFKc0XP2F
                        ByYU2l0gFzGKE8zVSzfmMD8GA1UdHwQ4MDYwNKAyoDCGLmh0dHA6Ly9wb3N0ZWNlcnQucG9zdGUu
                        aXQvcG9zdGVjb21jYTMvY3JsMy5jcmwwHQYDVR0OBBYEFEvrikZQkfBjuiTpxExSBe8wGgsyMA0G
                        CSqGSIb3DQEBCwUAA4IBAQBNAw8UoeiCF+1rFs27d3bEef6CLe/PJga9EfwKItjMDD9QzT/FShRW
                        KLHlK69MHL1ZLPRPvuWUTkIOHTpNqBPILvO1u13bSg+6o+2OdqAkCBkbTqbGjWSPLaTUVNV6MbXm
                        vttD8Vd9vIZg1xBBG3Fai13dwvSj3hAZd8ug8a8fW1y/iDbRC5D1O+HlHDuvIW4LbJ093jdj+oZw
                        Syd216gtXL00QA0C1uMuDv9Wf9IxniTb710dRSgIcM4/eR7832fZgdOsoalFzGYWxSCs8WOZrjpu
                        b1fdaRSEuCQk2+gmdsiRcTs9EqPCCNiNlrNAiWEyGtL8A4ao3pDMwCtrb2yr</ds:X509Certificate>
                </ds:X509Data>
            </ds:KeyInfo>
        </md:KeyDescriptor>
        <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://posteid.poste.it/jod-fs/sloservicepost" ResponseLocation="https://posteid.poste.it/jod-fs/sloserviceresponsepost"/>
        <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://posteid.poste.it/jod-fs/sloserviceredirect" ResponseLocation="https://posteid.poste.it/jod-fs/sloserviceresponseredirect"/>
        <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</md:NameIDFormat>
        <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://posteid.poste.it/jod-fs/ssoservicepost"/>
        <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://posteid.poste.it/jod-fs/ssoserviceredirect"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="familyName" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="name" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="spidCode" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="fiscalNumber" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="gender" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="dateOfBirth" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="placeOfBirth" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="countyOfBirth" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="idCard" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="address" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="digitalAddress" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="expirationDate" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="email" NameFormat="xsi:string"/>
        <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="mobilePhone" NameFormat="xsi:string"/>
    </md:IDPSSODescriptor>
    <md:Organization>
        <md:OrganizationName xml:lang="it">Poste Italiane SpA</md:OrganizationName>
        <md:OrganizationDisplayName xml:lang="it">Poste Italiane
            SpA</md:OrganizationDisplayName>
        <md:OrganizationURL xml:lang="it">https://www.poste.it</md:OrganizationURL>
    </md:Organization>
</md:EntityDescriptor>
<!-- POSTE ID *end* -->
</md:EntitiesDescriptor>
`;

const invalidMockMetadata = `
<?xml version="1.0" encoding="UTF-8" standalone="no"?><md:EntitiesDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ID="_34aadd11-e3d9-4311-a410-4039de088446" Name="https://idps.spid.gov.it"><ds:Signature>
<ds:SignedInfo>
<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
<ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
<ds:Reference URI="#_34aadd11-e3d9-4311-a410-4039de088446">
<ds:Transforms>
<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
<ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
</ds:Transforms>
<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
<ds:DigestValue>hCIkzc0YP+EJj/cJM116xnvDOF+TRmW2q4eH/NdxFqg=</ds:DigestValue>
</ds:Reference>
</ds:SignedInfo>
<ds:SignatureValue>
3AM3/CXf6xj412sj7GDLP2cOrV+jLdV7HUBCPxX4jUstlpY96PzQLXbsmdpfqdMsG5BcwAWL39Xs
UBeBQE5c6DMDr4qXHturcSce8ZN4bYVk/zQYg8W0xIHNnjA2EX/gEN6s+x474Keiq0+UVBxJHa98
zTwcnJvJzSQ8+5u9OblmzNg9DFGv6IEmoKmdWVbxywv6d5k3dYDfCM8ZCaqFXLdfNKHB74g7YaOq
k8rC5oWaW1MvggsW8aflALswnlohW7Yyrnt+NI5HxLIHdqo13HLXq3LfbgWEqxuBB9eHZqX1bXB6
ugc1VDHVSSIblsbYBIs7H2owXTBTBH57OYXUxQ==
</ds:SignatureValue>
<ds:KeyInfo>
<ds:KeyValue>
<ds:RSAKeyValue>
<ds:Modulus>
4HVbuVj/NajswD7LrDXg73FRxtFrTJZkIBrnxCt6NzhWAOdH2DjQ0qjDoY6XIGPMyTI5YLGCZhDY
6g8jEh4yKsz2bLGvkz4rYzqODqkYJZysoYgnZ8oPdYkJON+2oqGewarcbXeeO1eKUNnbU8IzPffr
Sb4LReFOQpUrvUjFcjTkIyBYoxR79SGjCtlLuL55FpY4+N4/IOjVkiZcPudhbFhYY8G7yFFOsXgW
lqB5RBCzMtmcIQeamWJkWb/Z8K4MnPjhBAuJoMf5fSRLrsmQlcjSnFGAY97lAxFnySb/mmtGoFh1
1aFEsi3WihlMpoTfHuVin1o2P4KAg+3yN5kgrw==
</ds:Modulus>
<ds:Exponent>AQAB</ds:Exponent>
</ds:RSAKeyValue>
</ds:KeyValue>
<ds:X509Data>
<ds:X509Certificate>
MIIDjDCCAnQCCQDrwdpdNHQoozANBgkqhkiG9w0BAQsFADCBhzELMAkGA1UEBhMCSVQxDTALBgNV
BAgMBFJvbWExDTALBgNVBAcMBFJvbWExDTALBgNVBAoMBEFnSUQxDTALBgNVBAsMBFNQSUQxGTAX
BgNVBAMMEHNwaWQuYWdpZC5nb3YuaXQxITAfBgkqhkiG9w0BCQEWEnJvc2luaUBhZ2lkLmdvdi5p
dDAeFw0xODEyMjExNTE5NTdaFw0xOTEyMjExNTE5NTdaMIGHMQswCQYDVQQGEwJJVDENMAsGA1UE
CAwEUm9tYTENMAsGA1UEBwwEUm9tYTENMAsGA1UECgwEQWdJRDENMAsGA1UECwwEU1BJRDEZMBcG
A1UEAwwQc3BpZC5hZ2lkLmdvdi5pdDEhMB8GCSqGSIb3DQEJARYScm9zaW5pQGFnaWQuZ292Lml0
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4HVbuVj/NajswD7LrDXg73FRxtFrTJZk
IBrnxCt6NzhWAOdH2DjQ0qjDoY6XIGPMyTI5YLGCZhDY6g8jEh4yKsz2bLGvkz4rYzqODqkYJZys
oYgnZ8oPdYkJON+2oqGewarcbXeeO1eKUNnbU8IzPffrSb4LReFOQpUrvUjFcjTkIyBYoxR79SGj
CtlLuL55FpY4+N4/IOjVkiZcPudhbFhYY8G7yFFOsXgWlqB5RBCzMtmcIQeamWJkWb/Z8K4MnPjh
BAuJoMf5fSRLrsmQlcjSnFGAY97lAxFnySb/mmtGoFh11aFEsi3WihlMpoTfHuVin1o2P4KAg+3y
N5kgrwIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQCVgOxgPxVQhqzKTmBPMcTFQph4LWo89tAACR44
oXvMqT5u1Qyi8cpYu7IOg3VWYMgsoTxExXC4sicWfQJa+aGBtSXv4jB1ZQ7HEXaJxVQuguahJBwQ
5Y61ebWyNmiUPySbRNbpQlinL8ulTjE6uPSSydMvleOxpF9uyUH7gLvzfgkovLr8MZtNCNUaEfJs
Youdvxtwmpv1yKvvkGpExGK99fsp60mHHdQDsbRq9ymH8GzY8vmbVVK63QFYdG5aJdGg8sCA/0th
lMDbdL6Ec/0xAljQSOFpozFduGoYTKF6Ig2Z5NleHPuYVyWLmBhw0lGfyvKGyk9Ev55WxTwHapQB
</ds:X509Certificate>
</ds:X509Data>
</ds:KeyInfo>
</ds:Signature>
<!-- BROKEN ARUBA ID *start* -->
<md:EntityDescriptor ID="_a9c69a62-90b7-4ba6-80f8-98dc2f20579e" entityID="https://loginspid.aruba.it">
    <md:IDPSSODescriptor WantAuthnRequestsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <md:KeyDescriptor use="signing">
            <ds:KeyInfo>
                <ds:X509Data>
                    <ds:X509Certificate>MIIExTCCA62gAwIBAgIQIHtEvEhGM77HwqsuvSbi9zANBgkqhkiG9w0BAQsFADBsMQswCQYDVQQG
                        EwJJVDEYMBYGA1UECgwPQXJ1YmFQRUMgUy5wLkEuMSEwHwYDVQQLDBhDZXJ0aWZpY2F0aW9uIEF1
                        dGhvcml0eUIxIDAeBgNVBAMMF0FydWJhUEVDIFMucC5BLiBORyBDQSAyMB4XDTE3MDEyMzAwMDAw
                        MFoXDTIwMDEyMzIzNTk1OVowgaAxCzAJBgNVBAYTAklUMRYwFAYDVQQKDA1BcnViYSBQRUMgc3Bh
                        MREwDwYDVQQLDAhQcm9kb3R0bzEWMBQGA1UEAwwNcGVjLml0IHBlYy5pdDEZMBcGA1UEBRMQWFhY
                        WFhYMDBYMDBYMDAwWDEPMA0GA1UEKgwGcGVjLml0MQ8wDQYDVQQEDAZwZWMuaXQxETAPBgNVBC4T
                        CDE2MzQ1MzgzMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqt2oHJhcp03l73p+QYpE
                        J+f3jYYj0W0gos0RItZx/w4vpsiKBygaqDNVWSwfo1aPdVDIX13f62O+lBki29KTt+QWv5K6SGHD
                        UXYPntRdEQlicIBh2Z0HfrM7fDl+xeJrMp1s4dsSQAuB5TJOlFZq7xCQuukytGWBTvjfcN/os5aE
                        sEg+RbtZHJR26SbbUcIqWb27Swgj/9jwK+tvzLnP4w8FNvEOrNfR0XwTMNDFrwbOCuWgthv5jNBs
                        VZaoqNwiA/MxYt+gTOMj/o5PWKk8Wpm6o/7/+lWAoxh0v8x9OkbIi+YaFpIxuCcUqsrJJk63x2gH
                        Cc2nr+yclYUhsKD/AwIDAQABo4IBLDCCASgwDgYDVR0PAQH/BAQDAgeAMB0GA1UdDgQWBBTKQ3+N
                        PGcXFk8nX994vMTVpba1EzBHBgNVHSAEQDA+MDwGCysGAQQBgegtAQEBMC0wKwYIKwYBBQUHAgEW
                        H2h0dHBzOi8vY2EuYXJ1YmFwZWMuaXQvY3BzLmh0bWwwWAYDVR0fBFEwTzBNoEugSYZHaHR0cDov
                        L2NybC5hcnViYXBlYy5pdC9BcnViYVBFQ1NwQUNlcnRpZmljYXRpb25BdXRob3JpdHlCL0xhdGVz
                        dENSTC5jcmwwHwYDVR0jBBgwFoAU8v9jQBwRQv3M3/FZ9m7omYcxR3kwMwYIKwYBBQUHAQEEJzAl
                        MCMGCCsGAQUFBzABhhdodHRwOi8vb2NzcC5hcnViYXBlYy5pdDANBgkqhkiG9w0BAQsFAAOCAQEA
                        nEw0NuaspbpDjA5wggwFtfQydU6b3Bw2/KXPRKS2JoqGmx0SYKj+L17A2KUBa2c7gDtKXYz0FLT6
                        0Bv0pmBN/oYCgVMEBJKqwRwdki9YjEBwyCZwNEx1kDAyyqFEVU9vw/OQfrAdp7MTbuZGFKknVt7b
                        9wOYy/Op9FiUaTg6SuOy0ep+rqhihltYNAAl4L6fY45mHvqa5vvVG30OvLW/S4uvRYUXYwY6KhWv
                        NdDf5CnFugnuEZtHJrVe4wx9aO5GvFLFZ/mQ35C5mXPQ7nIb0CDdLBJdz82nUoLSA5BUbeXAUkfa
                        hW/hLxLdhks68/TK694xVIuiB40pvMmJwxIyDA==</ds:X509Certificate>
                </ds:X509Data>
            </ds:KeyInfo>
        </md:KeyDescriptor>
        <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://loginspid.aruba.it/ServiceLogoutRequest"/>
        <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://loginspid.aruba.it/ServiceLogoutRequest"/>
        <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</md:NameIDFormat>
        <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://loginspid.aruba.it/ServiceLoginWelcome"/>
    </md:IDPSSODescriptor>
    <md:Organization>
        <md:OrganizationName xml:lang="it">ArubaPEC S.p.A.</md:OrganizationName>
        <md:OrganizationDisplayName xml:lang="it">ArubaPEC S.p.A.</md:OrganizationDisplayName>
        <md:OrganizationURL xml:lang="it">https://www.pec.it/</md:OrganizationURL>
    </md:Organization>
</md:EntityDescriptor>
<!-- BROKEN ARUBA ID *end* -->
<!-- BROKEN POSTE ID *start* -->
    <md:EntityDescriptor ID="_c29324e5-416c-43d2-b7ba-baf3d7b18800" cacheDuration="P0Y0M30DT0H0M0.000S" entityID="https://posteid.poste.it">
        <md:IDPSSODescriptor WantAuthnRequestsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
            <md:KeyDescriptor use="signing">
                <ds:KeyInfo>
                    <ds:X509Data>
                        <ds:X509Certificate></ds:X509Certificate>
                    </ds:X509Data>
                </ds:KeyInfo>
            </md:KeyDescriptor>
            <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://posteid.poste.it/jod-fs/sloservicepost" ResponseLocation="https://posteid.poste.it/jod-fs/sloserviceresponsepost"/>
            <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://posteid.poste.it/jod-fs/sloserviceredirect" ResponseLocation="https://posteid.poste.it/jod-fs/sloserviceresponseredirect"/>
            <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</md:NameIDFormat>
            <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://posteid.poste.it/jod-fs/ssoservicepost"/>
            <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://posteid.poste.it/jod-fs/ssoserviceredirect"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="familyName" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="name" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="spidCode" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="fiscalNumber" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="gender" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="dateOfBirth" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="placeOfBirth" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="countyOfBirth" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="idCard" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="address" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="digitalAddress" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="expirationDate" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="email" NameFormat="xsi:string"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Name="mobilePhone" NameFormat="xsi:string"/>
        </md:IDPSSODescriptor>
        <md:Organization>
            <md:OrganizationName xml:lang="it">Poste Italiane SpA</md:OrganizationName>
            <md:OrganizationDisplayName xml:lang="it">Poste Italiane
                SpA</md:OrganizationDisplayName>
            <md:OrganizationURL xml:lang="it">https://www.poste.it</md:OrganizationURL>
        </md:Organization>
    </md:EntityDescriptor>
    <!-- BROKEN POSTE ID *end* -->
    <!-- FAKE ID *start* -->
    <md:EntityDescriptor ID="_a9c69a62-90b7-4ba6-80f8-98dc2f20579e" entityID="https://fake.spid.it">
        <md:IDPSSODescriptor WantAuthnRequestsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
            <md:KeyDescriptor use="signing">
                <ds:KeyInfo>
                    <ds:X509Data>
                        <ds:X509Certificate>MIIDjDCCAnQCCQDrwdpdNHQoozANBgkqhkiG9w0BAQsFADCBhzELMAkGA1UEBhMCSVQxDTALBgNV
                        BAgMBFJvbWExDTALBgNVBAcMBFJvbWExDTALBgNVBAoMBEFnSUQxDTALBgNVBAsMBFNQSUQxGTAX
                        BgNVBAMMEHNwaWQuYWdpZC5nb3YuaXQxITAfBgkqhkiG9w0BCQEWEnJvc2luaUBhZ2lkLmdvdi5p
                        dDAeFw0xODEyMjExNTE5NTdaFw0xOTEyMjExNTE5NTdaMIGHMQswCQYDVQQGEwJJVDENMAsGA1UE
                        CAwEUm9tYTENMAsGA1UEBwwEUm9tYTENMAsGA1UECgwEQWdJRDENMAsGA1UECwwEU1BJRDEZMBcG
                        A1UEAwwQc3BpZC5hZ2lkLmdvdi5pdDEhMB8GCSqGSIb3DQEJARYScm9zaW5pQGFnaWQuZ292Lml0
                        MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4HVbuVj/NajswD7LrDXg73FRxtFrTJZk
                        IBrnxCt6NzhWAOdH2DjQ0qjDoY6XIGPMyTI5YLGCZhDY6g8jEh4yKsz2bLGvkz4rYzqODqkYJZys
                        oYgnZ8oPdYkJON+2oqGewarcbXeeO1eKUNnbU8IzPffrSb4LReFOQpUrvUjFcjTkIyBYoxR79SGj
                        CtlLuL55FpY4+N4/IOjVkiZcPudhbFhYY8G7yFFOsXgWlqB5RBCzMtmcIQeamWJkWb/Z8K4MnPjh
                        BAuJoMf5fSRLrsmQlcjSnFGAY97lAxFnySb/mmtGoFh11aFEsi3WihlMpoTfHuVin1o2P4KAg+3y
                        N5kgrwIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQCVgOxgPxVQhqzKTmBPMcTFQph4LWo89tAACR44
                        oXvMqT5u1Qyi8cpYu7IOg3VWYMgsoTxExXC4sicWfQJa+aGBtSXv4jB1ZQ7HEXaJxVQuguahJBwQ
                        5Y61ebWyNmiUPySbRNbpQlinL8ulTjE6uPSSydMvleOxpF9uyUH7gLvzfgkovLr8MZtNCNUaEfJs
                        Youdvxtwmpv1yKvvkGpExGK99fsp60mHHdQDsbRq9ymH8GzY8vmbVVK63QFYdG5aJdGg8sCA/0th
                        lMDbdL6Ec/0xAljQSOFpozFduGoYTKF6Ig2Z5NleHPuYVyWLmBhw0lGfyvKGyk9Ev55WxTwHapQB</ds:X509Certificate>
                    </ds:X509Data>
                </ds:KeyInfo>
            </md:KeyDescriptor>
            <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://fake.spid.it/ServiceLogoutRequest"/>
            <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://fake.spid.it/ServiceLogoutRequest"/>
            <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</md:NameIDFormat>
            <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://fake.spid.it/ServiceLoginWelcome"/>
            <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://fake.spid.it/ServiceLoginWelcome"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" FriendlyName="Codice identificativo SPID" Name="spidCode"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" FriendlyName="Nome" Name="name"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" FriendlyName="Cognome" Name="familyName"/>
        </md:IDPSSODescriptor>
        <md:Organization>
            <md:OrganizationName xml:lang="it">Fake S.p.A.</md:OrganizationName>
            <md:OrganizationDisplayName xml:lang="it">Fake S.p.A.</md:OrganizationDisplayName>
            <md:OrganizationURL xml:lang="it">https://www.fake.it/</md:OrganizationURL>
        </md:Organization>
    </md:EntityDescriptor>
    <!-- FAKE ID *end* -->
</md:EntitiesDescriptor>
`;

const posteEntityId = "https://posteid.poste.it";
const fakeEntityId = "https://fake.spid.it";

const expectedMetadata = {
  cert: new NonEmptyArray(
    "MIIEKzCCAxOgAwIBAgIDE2Y0MA0GCSqGSIb3DQEBCwUAMGAxCzAJBgNVBAYTAklUMRgwFgYDVQQKDA9Qb3N0ZWNvbSBTLnAuQS4xIDAeBgNVBAsMF0NlcnRpZmljYXRpb24gQXV0aG9yaXR5MRUwEwYDVQQDDAxQb3N0ZWNvbSBDQTMwHhcNMTYwMjI2MTU1MjQ0WhcNMjEwMjI2MTU1MjQ0WjBxMQswCQYDVQQGEwJJVDEOMAwGA1UECAwFSXRhbHkxDTALBgNVBAcMBFJvbWUxHjAcBgNVBAoMFVBvc3RlIEl0YWxpYW5lIFMucC5BLjENMAsGA1UECwwEU1BJRDEUMBIGA1UEAwwLSURQLVBvc3RlSUQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDZFEtJoEHFAjpCaZcj5DVWrRDyaLZyu31XApslbo87CyWz61OJMtw6QQU0MdCtrYbtSJ6vJwx7/6EUjsZ3u4x3EPLdlkyiGOqukPwATv4c7TVOUVs5onIqTphM9b+AHRg4ehiMGesm/9d7RIaLuN79iPUvdLn6WP3idAfEw+rhJ/wYEQ0h1Xm5osNUgtWcBGavZIjLssWNrDDfJYxXH3QZ0kI6feEvLCJwgjXLGkBuhFehNhM4fhbX9iUCWwwkJ3JsP2++Rc/iTA0LZhiUsXNNq7gBcLAJ9UX2V1dWjTzBHevfHspzt4e0VgIIwbDRqsRtF8VUPSDYYbLoqwbLt18XAgMBAAGjgdwwgdkwRgYDVR0gBD8wPTAwBgcrTAsBAgEBMCUwIwYIKwYBBQUHAgEWF2h0dHA6Ly93d3cucG9zdGVjZXJ0Lml0MAkGBytMCwEBCgIwDgYDVR0PAQH/BAQDAgSwMB8GA1UdIwQYMBaAFKc0XP2FByYU2l0gFzGKE8zVSzfmMD8GA1UdHwQ4MDYwNKAyoDCGLmh0dHA6Ly9wb3N0ZWNlcnQucG9zdGUuaXQvcG9zdGVjb21jYTMvY3JsMy5jcmwwHQYDVR0OBBYEFEvrikZQkfBjuiTpxExSBe8wGgsyMA0GCSqGSIb3DQEBCwUAA4IBAQBNAw8UoeiCF+1rFs27d3bEef6CLe/PJga9EfwKItjMDD9QzT/FShRWKLHlK69MHL1ZLPRPvuWUTkIOHTpNqBPILvO1u13bSg+6o+2OdqAkCBkbTqbGjWSPLaTUVNV6MbXmvttD8Vd9vIZg1xBBG3Fai13dwvSj3hAZd8ug8a8fW1y/iDbRC5D1O+HlHDuvIW4LbJ093jdj+oZwSyd216gtXL00QA0C1uMuDv9Wf9IxniTb710dRSgIcM4/eR7832fZgdOsoalFzGYWxSCs8WOZrjpub1fdaRSEuCQk2+gmdsiRcTs9EqPCCNiNlrNAiWEyGtL8A4ao3pDMwCtrb2yr",
    []
  ),
  entityID: posteEntityId,
  entryPoint: "https://posteid.poste.it/jod-fs/ssoserviceredirect",
  logoutUrl: "https://posteid.poste.it/jod-fs/sloserviceredirect"
};

const expectedIDPOption = {
  ...expectedMetadata,
  cert: [
    "MIIEKzCCAxOgAwIBAgIDE2Y0MA0GCSqGSIb3DQEBCwUAMGAxCzAJBgNVBAYTAklUMRgwFgYDVQQKDA9Qb3N0ZWNvbSBTLnAuQS4xIDAeBgNVBAsMF0NlcnRpZmljYXRpb24gQXV0aG9yaXR5MRUwEwYDVQQDDAxQb3N0ZWNvbSBDQTMwHhcNMTYwMjI2MTU1MjQ0WhcNMjEwMjI2MTU1MjQ0WjBxMQswCQYDVQQGEwJJVDEOMAwGA1UECAwFSXRhbHkxDTALBgNVBAcMBFJvbWUxHjAcBgNVBAoMFVBvc3RlIEl0YWxpYW5lIFMucC5BLjENMAsGA1UECwwEU1BJRDEUMBIGA1UEAwwLSURQLVBvc3RlSUQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDZFEtJoEHFAjpCaZcj5DVWrRDyaLZyu31XApslbo87CyWz61OJMtw6QQU0MdCtrYbtSJ6vJwx7/6EUjsZ3u4x3EPLdlkyiGOqukPwATv4c7TVOUVs5onIqTphM9b+AHRg4ehiMGesm/9d7RIaLuN79iPUvdLn6WP3idAfEw+rhJ/wYEQ0h1Xm5osNUgtWcBGavZIjLssWNrDDfJYxXH3QZ0kI6feEvLCJwgjXLGkBuhFehNhM4fhbX9iUCWwwkJ3JsP2++Rc/iTA0LZhiUsXNNq7gBcLAJ9UX2V1dWjTzBHevfHspzt4e0VgIIwbDRqsRtF8VUPSDYYbLoqwbLt18XAgMBAAGjgdwwgdkwRgYDVR0gBD8wPTAwBgcrTAsBAgEBMCUwIwYIKwYBBQUHAgEWF2h0dHA6Ly93d3cucG9zdGVjZXJ0Lml0MAkGBytMCwEBCgIwDgYDVR0PAQH/BAQDAgSwMB8GA1UdIwQYMBaAFKc0XP2FByYU2l0gFzGKE8zVSzfmMD8GA1UdHwQ4MDYwNKAyoDCGLmh0dHA6Ly9wb3N0ZWNlcnQucG9zdGUuaXQvcG9zdGVjb21jYTMvY3JsMy5jcmwwHQYDVR0OBBYEFEvrikZQkfBjuiTpxExSBe8wGgsyMA0GCSqGSIb3DQEBCwUAA4IBAQBNAw8UoeiCF+1rFs27d3bEef6CLe/PJga9EfwKItjMDD9QzT/FShRWKLHlK69MHL1ZLPRPvuWUTkIOHTpNqBPILvO1u13bSg+6o+2OdqAkCBkbTqbGjWSPLaTUVNV6MbXmvttD8Vd9vIZg1xBBG3Fai13dwvSj3hAZd8ug8a8fW1y/iDbRC5D1O+HlHDuvIW4LbJ093jdj+oZwSyd216gtXL00QA0C1uMuDv9Wf9IxniTb710dRSgIcM4/eR7832fZgdOsoalFzGYWxSCs8WOZrjpub1fdaRSEuCQk2+gmdsiRcTs9EqPCCNiNlrNAiWEyGtL8A4ao3pDMwCtrb2yr"
  ]
};

describe("idpLoader#parseIdpMetadata", () => {
  it("parsing valid metadata xml file", () => {
    const parsedMetadata = parseIdpMetadata(mockMetadata);
    expect(parsedMetadata).toEqual([expectedMetadata]);
  });

  it("parsing invalid metadata xml file", () => {
    const parsedMetadata = parseIdpMetadata(invalidMockMetadata);
    expect(parsedMetadata).toEqual([
      {
        cert: new NonEmptyArray(
          "MIIDjDCCAnQCCQDrwdpdNHQoozANBgkqhkiG9w0BAQsFADCBhzELMAkGA1UEBhMCSVQxDTALBgNVBAgMBFJvbWExDTALBgNVBAcMBFJvbWExDTALBgNVBAoMBEFnSUQxDTALBgNVBAsMBFNQSUQxGTAXBgNVBAMMEHNwaWQuYWdpZC5nb3YuaXQxITAfBgkqhkiG9w0BCQEWEnJvc2luaUBhZ2lkLmdvdi5pdDAeFw0xODEyMjExNTE5NTdaFw0xOTEyMjExNTE5NTdaMIGHMQswCQYDVQQGEwJJVDENMAsGA1UECAwEUm9tYTENMAsGA1UEBwwEUm9tYTENMAsGA1UECgwEQWdJRDENMAsGA1UECwwEU1BJRDEZMBcGA1UEAwwQc3BpZC5hZ2lkLmdvdi5pdDEhMB8GCSqGSIb3DQEJARYScm9zaW5pQGFnaWQuZ292Lml0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4HVbuVj/NajswD7LrDXg73FRxtFrTJZkIBrnxCt6NzhWAOdH2DjQ0qjDoY6XIGPMyTI5YLGCZhDY6g8jEh4yKsz2bLGvkz4rYzqODqkYJZysoYgnZ8oPdYkJON+2oqGewarcbXeeO1eKUNnbU8IzPffrSb4LReFOQpUrvUjFcjTkIyBYoxR79SGjCtlLuL55FpY4+N4/IOjVkiZcPudhbFhYY8G7yFFOsXgWlqB5RBCzMtmcIQeamWJkWb/Z8K4MnPjhBAuJoMf5fSRLrsmQlcjSnFGAY97lAxFnySb/mmtGoFh11aFEsi3WihlMpoTfHuVin1o2P4KAg+3yN5kgrwIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQCVgOxgPxVQhqzKTmBPMcTFQph4LWo89tAACR44oXvMqT5u1Qyi8cpYu7IOg3VWYMgsoTxExXC4sicWfQJa+aGBtSXv4jB1ZQ7HEXaJxVQuguahJBwQ5Y61ebWyNmiUPySbRNbpQlinL8ulTjE6uPSSydMvleOxpF9uyUH7gLvzfgkovLr8MZtNCNUaEfJsYoudvxtwmpv1yKvvkGpExGK99fsp60mHHdQDsbRq9ymH8GzY8vmbVVK63QFYdG5aJdGg8sCA/0thlMDbdL6Ec/0xAljQSOFpozFduGoYTKF6Ig2Z5NleHPuYVyWLmBhw0lGfyvKGyk9Ev55WxTwHapQB",
          []
        ),
        entityID: fakeEntityId,
        entryPoint: "https://fake.spid.it/ServiceLoginWelcome",
        logoutUrl: "https://fake.spid.it/ServiceLogoutRequest"
      }
    ]);
  });
});

describe("idpLoader#remapIpdMetadata", () => {
  it("remap valid metadata xml file", async () => {
    const parsedMetadata = parseIdpMetadata(mockMetadata);
    const idpsMetadataOption = mapIpdMetadata(parsedMetadata, {
      [posteEntityId]: "posteid"
    });
    const options: {
      idp: { [key: string]: IDPOption | undefined };
      // tslint:disable-next-line: no-any
      sp: any;
    } = {
      idp: {
        ...idpsMetadataOption
      },
      sp: {}
    };
    expect(options).toEqual({
      idp: {
        posteid: expectedIDPOption
      },
      sp: {}
    });
  });

  it("remap invalid metadata xml file", async () => {
    const parsedMetadata = parseIdpMetadata(invalidMockMetadata);
    const idpsMetadataOption = mapIpdMetadata(parsedMetadata, {
      [posteEntityId]: "posteid"
    });
    const options: {
      idp: { [key: string]: IDPOption | undefined };
      // tslint:disable-next-line: no-any
      sp: any;
    } = {
      idp: {
        ...idpsMetadataOption
      },
      sp: {}
    };
    expect(options).toEqual(options);
  });
});

describe("spidStrategy#loadFromRemote", () => {
  const IDPMetadataUrl =
    process.env.IDP_METADATA_URL ||
    "https://raw.githubusercontent.com/teamdigitale/io-backend/164984224-download-idp-metadata/test_idps/spid-entities-idps.xml";

  const mockFetchIdpMetadata = jest.fn((url: string) =>
    url ? Promise.resolve(mockMetadata) : Promise.reject(null)
  );

  const mockWarn = jest.fn();

  beforeEach(() => {
    jest.mock("../idpLoader", () => {
      return {
        fetchIdpMetadata: mockFetchIdpMetadata,
        mapIpdMetadata,
        parseIdpMetadata
      };
    });
    jest.mock("../logger", () => {
      return {
        log: {
          info: jest.fn(),
          warn: mockWarn
        }
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it("load idp options with missing idps configurations", async () => {
    const loadFromRemote = require("../../strategies/spidStrategy")
      .loadFromRemote;
    const idps = require("../../strategies/spidStrategy").IDP_IDS;
    const idpOptions = await loadFromRemote(IDPMetadataUrl, idps);
    expect(mockFetchIdpMetadata).toHaveBeenCalledWith(IDPMetadataUrl);
    expect(mockWarn).toHaveBeenCalledWith(
      "Missing SPID metadata on [%s]",
      IDPMetadataUrl
    );
    expect(idpOptions).toEqual({
      posteid: expectedIDPOption
    });
  });
});
