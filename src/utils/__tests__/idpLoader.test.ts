import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";
import { IDPEntityDescriptor } from "src/types/IDPEntityDescriptor";
import { mapIpdMetadata } from "../../strategies/spidStrategy";
import { parseIdpMetadata } from "../idpLoader";

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
    <!-- ARUBA ID *start* -->
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
            <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://loginspid.aruba.it/ServiceLoginWelcome"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" FriendlyName="Codice identificativo SPID" Name="spidCode"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" FriendlyName="Nome" Name="name"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" FriendlyName="Cognome" Name="familyName"/>
        </md:IDPSSODescriptor>
        <md:Organization>
            <md:OrganizationName xml:lang="it">ArubaPEC S.p.A.</md:OrganizationName>
            <md:OrganizationDisplayName xml:lang="it">ArubaPEC S.p.A.</md:OrganizationDisplayName>
            <md:OrganizationURL xml:lang="it">https://www.pec.it/</md:OrganizationURL>
        </md:Organization>
    </md:EntityDescriptor>
    <!-- ARUBA ID *end* -->
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
    <!-- ARUBA ID *start* -->
    <md:EntityDescriptor ID="_a9c69a62-90b7-4ba6-80f8-98dc2f20579e" entityID="https://loginspid.aruba.it">
        <md:IDPSSODescriptor WantAuthnRequestsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
            <md:KeyDescriptor use="signing">
                <ds:KeyInfo>
                    <ds:X509Data>
                        <ds:X509Certificate></ds:X509Certificate>
                    </ds:X509Data>
                </ds:KeyInfo>
            </md:KeyDescriptor>
            <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://loginspid.aruba.it/ServiceLogoutRequest"/>
            <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://loginspid.aruba.it/ServiceLogoutRequest"/>
            <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</md:NameIDFormat>
            <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://loginspid.aruba.it/ServiceLoginWelcome"/>
            <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://loginspid.aruba.it/ServiceLoginWelcome"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" FriendlyName="Codice identificativo SPID" Name="spidCode"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" FriendlyName="Nome" Name="name"/>
            <saml2:Attribute xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" FriendlyName="Cognome" Name="familyName"/>
        </md:IDPSSODescriptor>
        <md:Organization>
            <md:OrganizationName xml:lang="it">ArubaPEC S.p.A.</md:OrganizationName>
            <md:OrganizationDisplayName xml:lang="it">ArubaPEC S.p.A.</md:OrganizationDisplayName>
            <md:OrganizationURL xml:lang="it">https://www.pec.it/</md:OrganizationURL>
        </md:Organization>
    </md:EntityDescriptor>
    <!-- ARUBA ID *end* -->
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

const arubaEntityId = "https://loginspid.aruba.it";
const fakeEntityId = "https://fake.spid.it";

const expectedMetadata = {
  cert: new NonEmptyArray(
    "MIIExTCCA62gAwIBAgIQIHtEvEhGM77HwqsuvSbi9zANBgkqhkiG9w0BAQsFADBsMQswCQYDVQQGEwJJVDEYMBYGA1UECgwPQXJ1YmFQRUMgUy5wLkEuMSEwHwYDVQQLDBhDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eUIxIDAeBgNVBAMMF0FydWJhUEVDIFMucC5BLiBORyBDQSAyMB4XDTE3MDEyMzAwMDAwMFoXDTIwMDEyMzIzNTk1OVowgaAxCzAJBgNVBAYTAklUMRYwFAYDVQQKDA1BcnViYSBQRUMgc3BhMREwDwYDVQQLDAhQcm9kb3R0bzEWMBQGA1UEAwwNcGVjLml0IHBlYy5pdDEZMBcGA1UEBRMQWFhYWFhYMDBYMDBYMDAwWDEPMA0GA1UEKgwGcGVjLml0MQ8wDQYDVQQEDAZwZWMuaXQxETAPBgNVBC4TCDE2MzQ1MzgzMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqt2oHJhcp03l73p+QYpEJ+f3jYYj0W0gos0RItZx/w4vpsiKBygaqDNVWSwfo1aPdVDIX13f62O+lBki29KTt+QWv5K6SGHDUXYPntRdEQlicIBh2Z0HfrM7fDl+xeJrMp1s4dsSQAuB5TJOlFZq7xCQuukytGWBTvjfcN/os5aEsEg+RbtZHJR26SbbUcIqWb27Swgj/9jwK+tvzLnP4w8FNvEOrNfR0XwTMNDFrwbOCuWgthv5jNBsVZaoqNwiA/MxYt+gTOMj/o5PWKk8Wpm6o/7/+lWAoxh0v8x9OkbIi+YaFpIxuCcUqsrJJk63x2gHCc2nr+yclYUhsKD/AwIDAQABo4IBLDCCASgwDgYDVR0PAQH/BAQDAgeAMB0GA1UdDgQWBBTKQ3+NPGcXFk8nX994vMTVpba1EzBHBgNVHSAEQDA+MDwGCysGAQQBgegtAQEBMC0wKwYIKwYBBQUHAgEWH2h0dHBzOi8vY2EuYXJ1YmFwZWMuaXQvY3BzLmh0bWwwWAYDVR0fBFEwTzBNoEugSYZHaHR0cDovL2NybC5hcnViYXBlYy5pdC9BcnViYVBFQ1NwQUNlcnRpZmljYXRpb25BdXRob3JpdHlCL0xhdGVzdENSTC5jcmwwHwYDVR0jBBgwFoAU8v9jQBwRQv3M3/FZ9m7omYcxR3kwMwYIKwYBBQUHAQEEJzAlMCMGCCsGAQUFBzABhhdodHRwOi8vb2NzcC5hcnViYXBlYy5pdDANBgkqhkiG9w0BAQsFAAOCAQEAnEw0NuaspbpDjA5wggwFtfQydU6b3Bw2/KXPRKS2JoqGmx0SYKj+L17A2KUBa2c7gDtKXYz0FLT60Bv0pmBN/oYCgVMEBJKqwRwdki9YjEBwyCZwNEx1kDAyyqFEVU9vw/OQfrAdp7MTbuZGFKknVt7b9wOYy/Op9FiUaTg6SuOy0ep+rqhihltYNAAl4L6fY45mHvqa5vvVG30OvLW/S4uvRYUXYwY6KhWvNdDf5CnFugnuEZtHJrVe4wx9aO5GvFLFZ/mQ35C5mXPQ7nIb0CDdLBJdz82nUoLSA5BUbeXAUkfahW/hLxLdhks68/TK694xVIuiB40pvMmJwxIyDA==",
    []
  ),
  entityID: arubaEntityId,
  entryPoint: "https://loginspid.aruba.it/ServiceLoginWelcome",
  logoutUrl: "https://loginspid.aruba.it/ServiceLogoutRequest"
};

describe("idpLoader#parseIdpMetadata", () => {
  it("parsing valid metadata xml file", async () => {
    const parsedMetadata = parseIdpMetadata(mockMetadata);
    expect(parsedMetadata).toEqual([expectedMetadata]);
  });

  it("parsing invalid metadata xml file", async () => {
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

describe("spidStrategy#remapIpdMetadata", () => {
  it("remap valid metadata xml file", async () => {
    const parsedMetadata = parseIdpMetadata(mockMetadata);
    const idpsMetadataOption = mapIpdMetadata(parsedMetadata, {
      [arubaEntityId]: "arubaid"
    });
    const options: {
      idp: { [key: string]: IDPEntityDescriptor | undefined };
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
        arubaid: expectedMetadata
      },
      sp: {}
    });
  });

  it("remap invalid metadata xml file", async () => {
    const parsedMetadata = parseIdpMetadata(invalidMockMetadata);
    const idpsMetadataOption = mapIpdMetadata(parsedMetadata, {
      [arubaEntityId]: "arubaid"
    });
    const options: {
      idp: { [key: string]: IDPEntityDescriptor | undefined };
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
