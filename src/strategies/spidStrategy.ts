/**
 * Builds and configure a Passport strategy to authenticate the proxy to the
 * different SPID IDPs.
 */
// tslint:disable: no-object-mutation
import * as SpidStrategy from "spid-passport";
import { SpidUser } from "../types/user";
import { IDPMetadataOptions, parseIdpMetadata } from "../utils/idpLoader";
import { log } from "../utils/logger";

const spidStrategy = async (
  samlKey: string,
  samlCallbackUrl: string,
  samlIssuer: string,
  samlAcceptedClockSkewMs: number,
  samlAttributeConsumingServiceIndex: number,
  spidAutologin: string,
  spidTestEnvUrl: string,
  IDPMetadataUrl: string
) => {
  // tslint:disable-next-line: no-any
  const options: { idp: { [key: string]: IDPMetadataOptions }; sp: any } = {
    idp: {
      arubaid: {
        cert: [
          "MIIExTCCA62gAwIBAgIQIHtEvEhGM77HwqsuvSbi9zANBgkqhkiG9w0BAQsFADBsMQswCQYDVQQGEwJJVDEYMBYGA1UECgwPQXJ1YmFQRUMgUy5wLkEuMSEwHwYDVQQLDBhDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eUIxIDAeBgNVBAMMF0FydWJhUEVDIFMucC5BLiBORyBDQSAyMB4XDTE3MDEyMzAwMDAwMFoXDTIwMDEyMzIzNTk1OVowgaAxCzAJBgNVBAYTAklUMRYwFAYDVQQKDA1BcnViYSBQRUMgc3BhMREwDwYDVQQLDAhQcm9kb3R0bzEWMBQGA1UEAwwNcGVjLml0IHBlYy5pdDEZMBcGA1UEBRMQWFhYWFhYMDBYMDBYMDAwWDEPMA0GA1UEKgwGcGVjLml0MQ8wDQYDVQQEDAZwZWMuaXQxETAPBgNVBC4TCDE2MzQ1MzgzMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqt2oHJhcp03l73p+QYpEJ+f3jYYj0W0gos0RItZx/w4vpsiKBygaqDNVWSwfo1aPdVDIX13f62O+lBki29KTt+QWv5K6SGHDUXYPntRdEQlicIBh2Z0HfrM7fDl+xeJrMp1s4dsSQAuB5TJOlFZq7xCQuukytGWBTvjfcN/os5aEsEg+RbtZHJR26SbbUcIqWb27Swgj/9jwK+tvzLnP4w8FNvEOrNfR0XwTMNDFrwbOCuWgthv5jNBsVZaoqNwiA/MxYt+gTOMj/o5PWKk8Wpm6o/7/+lWAoxh0v8x9OkbIi+YaFpIxuCcUqsrJJk63x2gHCc2nr+yclYUhsKD/AwIDAQABo4IBLDCCASgwDgYDVR0PAQH/BAQDAgeAMB0GA1UdDgQWBBTKQ3+NPGcXFk8nX994vMTVpba1EzBHBgNVHSAEQDA+MDwGCysGAQQBgegtAQEBMC0wKwYIKwYBBQUHAgEWH2h0dHBzOi8vY2EuYXJ1YmFwZWMuaXQvY3BzLmh0bWwwWAYDVR0fBFEwTzBNoEugSYZHaHR0cDovL2NybC5hcnViYXBlYy5pdC9BcnViYVBFQ1NwQUNlcnRpZmljYXRpb25BdXRob3JpdHlCL0xhdGVzdENSTC5jcmwwHwYDVR0jBBgwFoAU8v9jQBwRQv3M3/FZ9m7omYcxR3kwMwYIKwYBBQUHAQEEJzAlMCMGCCsGAQUFBzABhhdodHRwOi8vb2NzcC5hcnViYXBlYy5pdDANBgkqhkiG9w0BAQsFAAOCAQEAnEw0NuaspbpDjA5wggwFtfQydU6b3Bw2/KXPRKS2JoqGmx0SYKj+L17A2KUBa2c7gDtKXYz0FLT60Bv0pmBN/oYCgVMEBJKqwRwdki9YjEBwyCZwNEx1kDAyyqFEVU9vw/OQfrAdp7MTbuZGFKknVt7b9wOYy/Op9FiUaTg6SuOy0ep+rqhihltYNAAl4L6fY45mHvqa5vvVG30OvLW/S4uvRYUXYwY6KhWvNdDf5CnFugnuEZtHJrVe4wx9aO5GvFLFZ/mQ35C5mXPQ7nIb0CDdLBJdz82nUoLSA5BUbeXAUkfahW/hLxLdhks68/TK694xVIuiB40pvMmJwxIyDA=="
        ],
        entryPoint: "https://loginspid.aruba.it/ServiceLoginWelcome",
        logoutUrl: "https://loginspid.aruba.it/ServiceLogoutRequest"
      },
      infocertid: {
        cert: [
          "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"
        ],
        entryPoint: "https://identity.infocert.it/spid/samlsso",
        logoutUrl: "https://identity.infocert.it/spid/samlslo"
      },
      intesaid: {
        cert: [
          "MIIEDjCCAvagAwIBAgIIIT1A+ywbIQAwDQYJKoZIhvcNAQELBQAwXjEzMDEGA1UEAwwqSU4uVEUuUy5BLiBTLnAuQSAtIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRowGAYDVQQKDBFJTi5URS5TLkEuIFMucC5BLjELMAkGA1UEBhMCSVQwHhcNMTcwOTE1MTMyMzQ1WhcNMzYwNzAxMTk1OTAwWjBQMSUwDwYDVQQuEwgyMDA3OTc5NzASBgNVBAMMC1NBTUwgU2lnbmVyMRowGAYDVQQKDBFJTi5URS5TLkEuIFMucC5BLjELMAkGA1UEBhMCSVQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDhYXkP+eQBURgmslDXBjG0ad+DkSAkWt7hUoaTyiK0e34QiyArq043plqTrt+6FzTGeX7960Qr3tCLGCiVOi47QuE09IKfJmKGEaUQnJQehHYZs/XV0OYQl18WrCxUX6ALOcqPs+4ypCbJV1WzSosfBcPBzivJER8kvrynMXI3or18e9XPTGBn8qNFyNF1E3BJ5UhrDvk5W2gKyYKz0M/CIu9PiHuO/ne6HbeNrCS/xzXtjsTusk41AOxIQoFbEzS08xcRY+QDE8oLcAmecSjT3xv3r9dWke6KTTAahS3K+5mOYRcBXj2FFegiUp+xh4OAWdH1+gGDYm+3aAmMpaLtAgMBAAGjgd0wgdowHQYDVR0OBBYEFEw9xWg4qvQGdlGMCqmJcVDgdE8aMAwGA1UdEwEB/wQCMAAwHwYDVR0jBBgwFoAUySnWJ2sw0ljDpJVrtrxCCP0b1CYwGgYDVR0QBBMwEYAPMjAxNzA5MTUxMzIzNDVaMD8GA1UdHwQ4MDYwNKAyoDCGLmh0dHA6Ly9lLXRydXN0Y29tLmludGVzYS5pdC9DUkwvSU5URVNBX25DQS5jcmwwDgYDVR0PAQH/BAQDAgSwMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDBDANBgkqhkiG9w0BAQsFAAOCAQEAVRHyFRZZFpW/qjJpKftd86h3wOdUqOhc2W8ZHv0st8ptG+mZk3l1iWAsEPqKMIBhksgTvalnHC1lHUt11xsZ2mzUjVpiG8XiWXYXQnY2D+q7Dc4n20kJ717qf4SDN8wX1A6XvT3Wrsfh87vg3ZFD56/eyur2snWu4OilsFqAyLhnExG4puJ4JKBWnlwAGXD9SFgkSZ8FC66KQs6CAwVkvCIom3IwJeU/VrYQF6XHkVCQgr5mojXgCkrlRNl53WAKfQHCT4QH+oQVP97PCEL/wQ1zi0UzWauKT6u2wDym9rcpch+WLa0GUtYNhuoLU2SregPKwTWg2DfINJObyWRpww=="
        ],
        entryPoint:
          "https://spid.intesa.it/Time4UserServices/services/idp/AuthnRequest/",
        logoutUrl:
          "https://spid.intesa.it/Time4UserServices/services/idp/SingleLogout"
      },
      lepidaid: {
        cert: [
          "MIIDHDCCAgSgAwIBAgIVALisbudTRxLy3vlMcEDfaqr3iW89MA0GCSqGSIb3DQEBCwUAMBcxFTATBgNVBAMMDGlkLmxlcGlkYS5pdDAeFw0xODA4MDgxMDIzMTJaFw0zODA4MDgxMDIzMTJaMBcxFTATBgNVBAMMDGlkLmxlcGlkYS5pdDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMOFERgxPEYPqAjN7oW6y8oSSY6tGm2OCIU+VyKhb2OqfNLpF8tPrytX17pgwVYHzjxRCNMTC83frbmtBapABtm9KuX7qaSPvaJx0+UqYk9FdKCKQOEkmWcNOJfwzNMP65B+cDxP3sa1JoAMeAO0x95bnYoX0ZHcssKkwpgMb8/JHZHzqu3odxADtO5PaT3xaCyMIcqIp1O2nVn7SizUE1gNucLAdaP4kh0o7nU61pz4pG3gQXK+uROteDD8cTU2Nxi7W1T73tQSuwst54BS2p9IBXzWrA9V0Ck10oiQTcIC8X9McepCrNzgCOBdap00Tifusb30t74BREARgwjp1N8CAwEAAaNfMF0wHQYDVR0OBBYEFL32/n7uf1Re14pW+gwGxZQHUZBCMDwGA1UdEQQ1MDOCDGlkLmxlcGlkYS5pdIYjaHR0cHM6Ly9pZC5sZXBpZGEuaXQvaWRwL3NoaWJib2xldGgwDQYJKoZIhvcNAQELBQADggEBAK80B1mEWKOTJkVJOJot2xU79Lhs1+domUSYQiA+tlS46IAfWwDZqI1llIjgL85n7qMsKFvYTIskInoG51Iezv2dTxlB6IMI8NPRfiFXo2s8NYjbzWyETbdXzCbDR0tKNke0TFE0oxunNfE5YRsmH4bPnjhPUjCSHX7wIhlNrLae3FjMQp1OLDs7HmJo3AhuAVmHCoG7QV/ly4ZHcVYx4F7HUsFg5uxNYjZbo+XMutJz4nZFOFE+uRzTwwfdR2sxny+ppkruTwIhEXyzknoiw1mGIEWZc6scnOAiwZeqTccUYVNHp+PSFs9SD8l+2PO4Oh8Y3dYT+5ojv+S6T7vy5xE="
        ],
        entryPoint: "https://id.lepida.it/idp/profile/SAML2/Redirect/SSO",
        logoutUrl: "https://id.lepida.it/idp/profile/SAML2/Redirect/SLO"
      },
      namirialid: {
        cert: [
          "MIIDNzCCAh+gAwIBAgIUNGvDUjTpLSPlP4sEfO0+JARITnEwDQYJKoZIhvcNAQELBQAwHjEcMBoGA1UEAwwTaWRwLm5hbWlyaWFsdHNwLmNvbTAeFw0xNzAzMDgwOTE3NTZaFw0zNzAzMDgwOTE3NTZaMB4xHDAaBgNVBAMME2lkcC5uYW1pcmlhbHRzcC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDrcJvYRh49nNijgzwL1OOwgzeMDUWcMSwoWdtMpx3kDhZwMFQ3ITDmNvlz21I0QKaP0BDg/UAjfCbDtLqUy6wHtI6NWVJoqIziw+dLfg7S5Sr2nOzJ/sKhzadWH1kDsetIenOLU2ex+7Vf/+4P7nIrS0c+xghi9/zN8dH6+09wWYnloGmcW3qWRFMKJjR3ctBmsmqCKWNIIq2QfeFszSSeG0xaNlLKBrj6TyPDxDqPAskq038W1fCuh7aejCk7XTTOxuuIwDGJiYsc8rfXSG9/auskAfCziGEm304/ojy5MRcNjekz4KgWxT9anMCipv0I2T7tCAivc1z9QCsEPk5pAgMBAAGjbTBrMB0GA1UdDgQWBBQi8+cnv0Nw0lbuICzxlSHsvBw5SzBKBgNVHREEQzBBghNpZHAubmFtaXJpYWx0c3AuY29thipodHRwczovL2lkcC5uYW1pcmlhbHRzcC5jb20vaWRwL3NoaWJib2xldGgwDQYJKoZIhvcNAQELBQADggEBAEp953KMWY7wJbJqnPTmDkXaZJVoubcjW86IY494RgVBeZ4XzAGOifa3ScDK6a0OWfIlRTbaKKu9lEVw9zs54vLp9oQI4JulomSaL805Glml4bYqtcLoh5qTnKaWp5qvzBgcQ7i2GcDC9F+qrsJYreCA7rbHXzF0hu5yIfz0BrrCRWvuWiop92WeKvtucI4oBGfoHhYOZsLuoTT3hZiEFJT60xS5Y2SNdz+Eia9Dgt0cvAzoOVk93Cxg+XBdyyEEiZn/zvhjus29KyFrzh3XYznh+4jq3ymt7Os4JKmY0aJm7yNxw+LyPjkdaB0icfo3+hD7PiuUjC3Y67LUWQ8YgOc="
        ],
        entryPoint:
          "https://idp.namirialtsp.com/idp/profile/SAML2/Redirect/SSO",
        logoutUrl: "https://idp.namirialtsp.com/idp/profile/SAML2/Redirect/SLO"
      },
      posteid: {
        cert: [
          "MIIEKzCCAxOgAwIBAgIDE2Y0MA0GCSqGSIb3DQEBCwUAMGAxCzAJBgNVBAYTAklUMRgwFgYDVQQKDA9Qb3N0ZWNvbSBTLnAuQS4xIDAeBgNVBAsMF0NlcnRpZmljYXRpb24gQXV0aG9yaXR5MRUwEwYDVQQDDAxQb3N0ZWNvbSBDQTMwHhcNMTYwMjI2MTU1MjQ0WhcNMjEwMjI2MTU1MjQ0WjBxMQswCQYDVQQGEwJJVDEOMAwGA1UECAwFSXRhbHkxDTALBgNVBAcMBFJvbWUxHjAcBgNVBAoMFVBvc3RlIEl0YWxpYW5lIFMucC5BLjENMAsGA1UECwwEU1BJRDEUMBIGA1UEAwwLSURQLVBvc3RlSUQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDZFEtJoEHFAjpCaZcj5DVWrRDyaLZyu31XApslbo87CyWz61OJMtw6QQU0MdCtrYbtSJ6vJwx7/6EUjsZ3u4x3EPLdlkyiGOqukPwATv4c7TVOUVs5onIqTphM9b+AHRg4ehiMGesm/9d7RIaLuN79iPUvdLn6WP3idAfEw+rhJ/wYEQ0h1Xm5osNUgtWcBGavZIjLssWNrDDfJYxXH3QZ0kI6feEvLCJwgjXLGkBuhFehNhM4fhbX9iUCWwwkJ3JsP2++Rc/iTA0LZhiUsXNNq7gBcLAJ9UX2V1dWjTzBHevfHspzt4e0VgIIwbDRqsRtF8VUPSDYYbLoqwbLt18XAgMBAAGjgdwwgdkwRgYDVR0gBD8wPTAwBgcrTAsBAgEBMCUwIwYIKwYBBQUHAgEWF2h0dHA6Ly93d3cucG9zdGVjZXJ0Lml0MAkGBytMCwEBCgIwDgYDVR0PAQH/BAQDAgSwMB8GA1UdIwQYMBaAFKc0XP2FByYU2l0gFzGKE8zVSzfmMD8GA1UdHwQ4MDYwNKAyoDCGLmh0dHA6Ly9wb3N0ZWNlcnQucG9zdGUuaXQvcG9zdGVjb21jYTMvY3JsMy5jcmwwHQYDVR0OBBYEFEvrikZQkfBjuiTpxExSBe8wGgsyMA0GCSqGSIb3DQEBCwUAA4IBAQBNAw8UoeiCF+1rFs27d3bEef6CLe/PJga9EfwKItjMDD9QzT/FShRWKLHlK69MHL1ZLPRPvuWUTkIOHTpNqBPILvO1u13bSg+6o+2OdqAkCBkbTqbGjWSPLaTUVNV6MbXmvttD8Vd9vIZg1xBBG3Fai13dwvSj3hAZd8ug8a8fW1y/iDbRC5D1O+HlHDuvIW4LbJ093jdj+oZwSyd216gtXL00QA0C1uMuDv9Wf9IxniTb710dRSgIcM4/eR7832fZgdOsoalFzGYWxSCs8WOZrjpub1fdaRSEuCQk2+gmdsiRcTs9EqPCCNiNlrNAiWEyGtL8A4ao3pDMwCtrb2yr"
        ],
        entryPoint: "https://posteid.poste.it/jod-fs/ssoserviceredirect",
        logoutUrl: "https://posteid.poste.it/jod-fs/sloservicepost"
      },
      registerid: {
        cert: [
          "MIIEKzCCAxOgAwIBAgIDE2Y0MA0GCSqGSIb3DQEBCwUAMGAxCzAJBgNVBAYTAklUMRgwFgYDVQQKDA9Qb3N0ZWNvbSBTLnAuQS4xIDAeBgNVBAsMF0NlcnRpZmljYXRpb24gQXV0aG9yaXR5MRUwEwYDVQQDDAxQb3N0ZWNvbSBDQTMwHhcNMTYwMjI2MTU1MjQ0WhcNMjEwMjI2MTU1MjQ0WjBxMQswCQYDVQQGEwJJVDEOMAwGA1UECAwFSXRhbHkxDTALBgNVBAcMBFJvbWUxHjAcBgNVBAoMFVBvc3RlIEl0YWxpYW5lIFMucC5BLjENMAsGA1UECwwEU1BJRDEUMBIGA1UEAwwLSURQLVBvc3RlSUQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDZFEtJoEHFAjpCaZcj5DVWrRDyaLZyu31XApslbo87CyWz61OJMtw6QQU0MdCtrYbtSJ6vJwx7/6EUjsZ3u4x3EPLdlkyiGOqukPwATv4c7TVOUVs5onIqTphM9b+AHRg4ehiMGesm/9d7RIaLuN79iPUvdLn6WP3idAfEw+rhJ/wYEQ0h1Xm5osNUgtWcBGavZIjLssWNrDDfJYxXH3QZ0kI6feEvLCJwgjXLGkBuhFehNhM4fhbX9iUCWwwkJ3JsP2++Rc/iTA0LZhiUsXNNq7gBcLAJ9UX2V1dWjTzBHevfHspzt4e0VgIIwbDRqsRtF8VUPSDYYbLoqwbLt18XAgMBAAGjgdwwgdkwRgYDVR0gBD8wPTAwBgcrTAsBAgEBMCUwIwYIKwYBBQUHAgEWF2h0dHA6Ly93d3cucG9zdGVjZXJ0Lml0MAkGBytMCwEBCgIwDgYDVR0PAQH/BAQDAgSwMB8GA1UdIwQYMBaAFKc0XP2FByYU2l0gFzGKE8zVSzfmMD8GA1UdHwQ4MDYwNKAyoDCGLmh0dHA6Ly9wb3N0ZWNlcnQucG9zdGUuaXQvcG9zdGVjb21jYTMvY3JsMy5jcmwwHQYDVR0OBBYEFEvrikZQkfBjuiTpxExSBe8wGgsyMA0GCSqGSIb3DQEBCwUAA4IBAQBNAw8UoeiCF+1rFs27d3bEef6CLe/PJga9EfwKItjMDD9QzT/FShRWKLHlK69MHL1ZLPRPvuWUTkIOHTpNqBPILvO1u13bSg+6o+2OdqAkCBkbTqbGjWSPLaTUVNV6MbXmvttD8Vd9vIZg1xBBG3Fai13dwvSj3hAZd8ug8a8fW1y/iDbRC5D1O+HlHDuvIW4LbJ093jdj+oZwSyd216gtXL00QA0C1uMuDv9Wf9IxniTb710dRSgIcM4/eR7832fZgdOsoalFzGYWxSCs8WOZrjpub1fdaRSEuCQk2+gmdsiRcTs9EqPCCNiNlrNAiWEyGtL8A4ao3pDMwCtrb2yr"
        ],
        entryPoint: "https://spid.register.it/login/sso",
        logoutUrl: "https://spid.register.it/login/singleLogout"
      },
      sielteid: {
        cert: [
          "MIIDczCCAlugAwIBAgIJAMsX0iEKQM6xMA0GCSqGSIb3DQEBCwUAMFAxCzAJBgNVBAYTAklUMQ4wDAYDVQQIDAVJdGFseTEgMB4GA1UEBwwXU2FuIEdyZWdvcmlvIGRpIENhdGFuaWExDzANBgNVBAoMBlNpZWx0ZTAeFw0xNTEyMTQwODE0MTVaFw0yNTEyMTMwODE0MTVaMFAxCzAJBgNVBAYTAklUMQ4wDAYDVQQIDAVJdGFseTEgMB4GA1UEBwwXU2FuIEdyZWdvcmlvIGRpIENhdGFuaWExDzANBgNVBAoMBlNpZWx0ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANIRlOjM/tS9V9jYjJreqZSctuYriLfPTDgX2XdhWEbMpMpwA9p0bsbLQoC1gP0piLO+qbCsIh9+boPfb4/dLIA7E+Vmm5/+evOtzvjfHG4oXjZK6jo08QwkVV8Bm1jkakJPVZ57QFbyDSr+uBbIMY7CjA2LdgnIIwKN/kSfFhrZUMJ6ZxwegM100X5psfNPSV9WUtgHsvqlIlvydPo2rMm21sg+2d3Vtg8DthNSYRLqgazCc0NTsigrH7niSbJCO0nq/svMX2rSFdh5GFK7/pxT+c3OFWqIR8r+RX4qW+auJqkbTuNRwxV22Sm6r69ZJwV0WspvsVJi+FYqiyoWhgUCAwEAAaNQME4wHQYDVR0OBBYEFCUx063GwUhEFDllwCBe/+jdeW+XMB8GA1UdIwQYMBaAFCUx063GwUhEFDllwCBe/+jdeW+XMAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBADF94c3JwyBM86QBLeoUZxRYKPniba8B39FfJk0pb+LejKfZMvspOrOFgYQQ9UrS8IFkBX9Xr7/tjRbr2cPwZNjrEZhoq+NfcE09bnaWTyEl1IEKK8TWOupJj9UNVpYXX0LfIRrMwNEzAPQykOaqPOnyHxOCPTY957xXSo3jXOyvugtvPHbd+iliAzUoPm1tgiTKWS+EkQ/e22eFv5NEyT+oHiKovrQ+voPWOIvJVMjiTyxRic8fEnI9zzV0SxWvFvty77wgcYbeEuFZa3iidhojUge8o1uY/JUyQjFxcvvfAgWSIZwdHiNyWaAgwzLPmPCPsvBdR3xrlcDg/9Bd3D0="
        ],
        entryPoint:
          "https://identity.sieltecloud.it/simplesaml/saml2/idp/SSO.php",
        logoutUrl:
          "https://identity.sieltecloud.it/simplesaml/saml2/idp/SLS.php"
      },
      spiditalia: {
        cert: [
          "MIIDazCCAlOgAwIBAgIED8R+MDANBgkqhkiG9w0BAQsFADBmMQswCQYDVQQGEwJJVDELMAkGA1UECBMCRkkxETAPBgNVBAcTCGZsb3JlbmNlMREwDwYDVQQKEwhyZWdpc3RlcjERMA8GA1UECxMIcmVnaXN0ZXIxETAPBgNVBAMTCHJlZ2lzdGVyMB4XDTE3MDcxMDEwMzM0OVoXDTI3MDcwODEwMzM0OVowZjELMAkGA1UEBhMCSVQxCzAJBgNVBAgTAkZJMREwDwYDVQQHEwhmbG9yZW5jZTERMA8GA1UEChMIcmVnaXN0ZXIxETAPBgNVBAsTCHJlZ2lzdGVyMREwDwYDVQQDEwhyZWdpc3RlcjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANkYXHbm3q6xt3wrLAXnytswtj2JE1MM8aYmNXkTgDMCwO/+ahQOoQru6IBTbjfWH9jr+Woy54FDdX6bHl+5/mO6l/yAB/bKgwe5HmUjZJ5oakJjWucsSm+VkEwN2HquBZoN+mktju00xvLX5VAjmDHvZc/b8NhNr/FRKlYITboygkhGiUwGI3wLf3IaB76J0o7ugpW2WNLcywpX+p1VWZAMCdHBveBe/e42hh6WnWPqdwYUWHOgJ8HX4IzCHifiS1n6eUMgtoTQOmSvTQDwSjD0WWJE8tWSYt+txXg1t+3A3tbZOFu7T442wE7DtMdUL4+8gimQS+e8PxDK1uTqIPUCAwEAAaMhMB8wHQYDVR0OBBYEFMCgo1gzCIcUThQIs5g5ikfv1D7eMA0GCSqGSIb3DQEBCwUAA4IBAQBnGw3i3hQ37L8vyelkyZMeO3tLK65Cqti4oVrQZxClGV5zNA6fIMDY8Mci1UhLwjzp29POd/sez0vuHZ/Vmmygzoye4jTKr6c3jAh0u81FTzefBU+vIietm9RuV3sd7D9xq6EqOY1NDL+rkvBcTFtiwLEUm2kHYu/U67jk73pxOtmqxQvQeMU8oi42tehMZGLIGp3U5lGS8YGGl+GtkkQ2Z5/PSm67HGP81kTArG/QX+bX+ykypTJVg9hfb9zOFQidp1HkCRIez6YhDiP/ZLurd6Grt/wVfZPNBO8EOgy25AkRZlp+UD686BFg7qq5KKEbz3qmPrj8deHL3duacZcp"
        ],
        entryPoint: "https://spid.register.it/login/sso",
        logoutUrl: "https://spid.register.it/login/singleLogout"
      },
      timid: {
        cert: [
          "MIIEKTCCAxGgAwIBAgIJAOCOuLmV0s27MA0GCSqGSIb3DQEBCwUAMIGqMSIwIAYDVQQDDBlUSSBUcnVzdCBUZWNobm9sb2dpZXMgc3JsMSgwJgYDVQQLDB9TZXJ2aXppIHBlciBsJ2lkZW50aXRhIGRpZ2l0YWxlMS4wLAYDVQQKDCVUZWxlY29tIEl0YWxpYSBUcnVzdCBUZWNobm9sb2dpZXMgc3JsMRAwDgYDVQQHDAdQb21lemlhMQswCQYDVQQIDAJSTTELMAkGA1UEBhMCSVQwHhcNMTcxMTE3MTUzNzIyWhcNMjExMTE2MTUzNzIyWjCBqjEiMCAGA1UEAwwZVEkgVHJ1c3QgVGVjaG5vbG9naWVzIHNybDEoMCYGA1UECwwfU2Vydml6aSBwZXIgbCdpZGVudGl0YSBkaWdpdGFsZTEuMCwGA1UECgwlVGVsZWNvbSBJdGFsaWEgVHJ1c3QgVGVjaG5vbG9naWVzIHNybDEQMA4GA1UEBwwHUG9tZXppYTELMAkGA1UECAwCUk0xCzAJBgNVBAYTAklUMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwEBMMNhDczJh9ewCYX/Ag135q4c0n4Qg6FGfX7mZcg6TVI8IBKdeLHUC/e80iyVkufmqeu0udaFPWywyWJ4nhP10oi0ft1ftO+7XYzX4yDPoiRtsF6dtI3drjyaHVgWcDOWJIVGAJtLbdp5vcFLcboDlw4d2JC9if8wndMK9d4Kbb1P4+6v/ERaGozBFFntzuGRUAq5f5tsk9mh6D+g38xdHnK1tj1PcDIvw0DaRkD6/JL1rjHss+5sLSHCRtT7FG0ynQne1PjnEgUXL9M0xeeS7cV2hSxDU2ghZ7t8pzcEY8vJp/mWA7PHT07Nonp3yoh8dgqBvAa+sS6wqpiPBfQIDAQABo1AwTjAdBgNVHQ4EFgQURVRGXUUj2q6nPlqzvIKHtQx4VrAwHwYDVR0jBBgwFoAURVRGXUUj2q6nPlqzvIKHtQx4VrAwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAOIndKJCOyi0qP0IK894er7/jGxV6XCEXY5PLlFa9ibnaPjusYXlMPn6rIjDUAkcMj/fVF0XYa862At1GWclS6S6yYDt06W/GoMknM5XsByxO5HzA7iuTc4MheUTdlvD05PtY6n3SXVQLTNp+zHdh/LlhI1d380DFDR8wZJzUnYJ+vb+2DU62+4gVytk0C6b4RNEK4kfHkQGdJyKnLjxtm66iJBP5w+cC1A0UdGx7xLv8EIVued0L9agJi5CCbly5UGXEGvGUZf7vSSMV0UM2tGbNY5vsZQX0aRl9NGZOsKBydY5FEgCk+SLYAHDq29EZZRcPE6dJqB1d5zLwUQ/vZg=="
        ],
        entryPoint: "https://login.id.tim.it/affwebservices/public/saml2sso",
        logoutUrl: "https://login.id.tim.it/affwebservices/public/saml2slo"
      },
      xx_testenv2: {
        cert: [
          "MIIC7TCCAdWgAwIBAgIJAMbxPOoBth1LMA0GCSqGSIb3DQEBCwUAMA0xCzAJBgNVBAYTAklUMB4XDTE4MDkwNDE0MDAxM1oXDTE4MTAwNDE0MDAxM1owDTELMAkGA1UEBhMCSVQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDJrW3y8Zd2jESPXGMRY04cHC4Qfo3302HEY1C6x1aDfW7aR/tXzNplfdw8ZtZugSSmHZBxVrR8aA08dUVbbtUw5qD0uAWKIeREqGfhM+J1STAMSI2/ZxA6t2fLmv8l1eRd1QGeRDm7yF9EEKGY9iUZD3LJf2mWdVBAzzYlG23M769k+9JuGZxuviNWMjojgYRiQFgzypUJJQz+Ihh3q7LMjjiQiiULVb9vnJg7UdU9Wf3xGRkxk6uiGP9SzWigSObUekYYQ4ZAI/spILywgDxVMMtv/eVniUFKLABtljn5cE9zltECahPbm7wIuMJpDDu5GYHGdYO0j+K7fhjvF2mzAgMBAAGjUDBOMB0GA1UdDgQWBBQEVmzA/L1/fd70ok+6xtDRF8A3HjAfBgNVHSMEGDAWgBQEVmzA/L1/fd70ok+6xtDRF8A3HjAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCRMo4M4PqS0iLTTRWfikMF4hYMapcpmuna6p8aee7CwTjS5y7y18RLvKTi9l8OI0dVkgokH8fq8/o13vMw4feGxro1hMeUilRtH52funrWC+FgPrqk3o/8cZOnq+CqnFFDfILLiEb/PVJMddvTXgv2f9O6u17f8GmMLzde1yvYDa1fG/Pi0fG2F0yw/CmtP8OTLSvxjPtJ+ZckGzZa9GotwHsoVJ+Od21OU2lOeCnOjJOAbewHgqwkCB4O4AT5RM4ThAQtoU8QibjD1XDk/ZbEHdKcofnziDyl0V8gglP2SxpzDaPX0hm4wgHk9BOtSikb72tfOw+pNfeSrZEr6ItQ"
        ],
        entryPoint: spidTestEnvUrl + "/sso",
        logoutUrl: spidTestEnvUrl + "/slo"
      }
    },
    sp: {
      acceptedClockSkewMs: samlAcceptedClockSkewMs,
      attributeConsumingServiceIndex: samlAttributeConsumingServiceIndex,
      attributes: {
        attributes: [
          "fiscalNumber",
          "name",
          "familyName",
          "email",
          "mobilePhone"
        ],
        name: "Required attributes"
      },
      callbackUrl: samlCallbackUrl,
      decryptionPvk: samlKey,
      identifierFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
      issuer: samlIssuer,
      organization: {
        URL: "https://github.com/teamdigitale/italia-backend",
        displayName: "Digital citizenship proxy",
        name: "Digital citizenship proxy"
      },
      privateCert: samlKey,
      signatureAlgorithm: "sha256"
    }
  };

  const ARUBA_ID = "https://loginspid.aruba.it";
  const INFOCERT_ID = "https://identity.infocert.it";
  const INTESA_ID = "https://spid.intesa.it";
  const LEPIDA_ID = "https://id.lepida.it/idp/shibboleth";
  const NAMIRIAL_ID = "https://idp.namirialtsp.com/idp";
  const POSTE_ID = "https://posteid.poste.it";
  const SIELTE_ID = "https://identity.sieltecloud.it";
  const SPIDITALIA_ID = "https://spid.register.it";
  const TIM_ID = "https://login.id.tim.it/affwebservices/public/saml2sso";

  const IDP_IDS: { [key: string]: string } = {
    [ARUBA_ID]: "arubaid",
    [INFOCERT_ID]: "infocertid",
    [INTESA_ID]: "intesaid",
    [LEPIDA_ID]: "lepidaid",
    [NAMIRIAL_ID]: "namirialid",
    [POSTE_ID]: "posteid",
    [SIELTE_ID]: "sielteid",
    [SPIDITALIA_ID]: "spiditalia",
    [TIM_ID]: "timid"
  };

  const idpMetadata = await parseIdpMetadata(IDPMetadataUrl);
  idpMetadata.forEach(idp => {
    if (IDP_IDS[idp.entityID]) {
      options.idp[IDP_IDS[idp.entityID]] = idp.getIDPOption();
    } else {
      log.error("Unsupported SPID idp from remote repository, will not used.");
    }
  });

  const optionsWithAutoLoginInfo = {
    ...options,
    sp: {
      ...options.sp,
      additionalParams: {
        auto_login: spidAutologin
      }
    }
  };

  return new SpidStrategy(
    spidAutologin === "" ? options : optionsWithAutoLoginInfo,
    (
      profile: SpidUser,
      done: (err: Error | undefined, info: SpidUser) => void
    ) => {
      log.info(profile.getAssertionXml());
      done(undefined, profile);
    }
  );
};

export default spidStrategy;
