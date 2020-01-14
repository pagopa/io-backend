/**
 * Builds and configure a Passport strategy to authenticate the proxy to the
 * different SPID IDPs.
 */
import { distanceInWordsToNow, isAfter, subDays } from "date-fns";
import * as SpidStrategy from "spid-passport";
import * as x509 from "x509";
import { SpidUser } from "../types/user";
import {
  fetchIdpMetadata,
  IDPOption,
  mapIpdMetadata,
  parseIdpMetadata
} from "../utils/idpLoader";
import { log } from "../utils/logger";

export const IDP_IDS: { [key: string]: string | undefined } = {
  "https://id.lepida.it/idp/shibboleth": "lepidaid",
  "https://identity.infocert.it": "infocertid",
  "https://identity.sieltecloud.it": "sielteid",
  "https://idp.namirialtsp.com/idp": "namirialid",
  "https://login.id.tim.it/affwebservices/public/saml2sso": "timid",
  "https://loginspid.aruba.it": "arubaid",
  "https://posteid.poste.it": "posteid",
  "https://spid.intesa.it": "intesaid",
  "https://spid.register.it": "spiditalia"
};

/**
 * Load idp Metadata from a remote url, parse infomations and return a mapped and whitelisted idp options
 * for spidStrategy object.
 */
export async function loadFromRemote(
  idpMetadataUrl: string,
  idpIds: { [key: string]: string | undefined }
): Promise<{ [key: string]: IDPOption | undefined }> {
  log.info("Fetching SPID metadata from [%s]...", idpMetadataUrl);
  const idpMetadataXML = await fetchIdpMetadata(idpMetadataUrl);
  log.info("Parsing SPID metadata...");
  const idpMetadata = parseIdpMetadata(idpMetadataXML);
  if (idpMetadata.length < Object.keys(idpIds).length) {
    log.warn("Missing SPID metadata on [%s]", idpMetadataUrl);
  }
  log.info("Configuring IdPs...");
  return mapIpdMetadata(idpMetadata, idpIds);
}

const spidStrategy = async (
  samlKey: string,
  samlCert: string,
  samlCallbackUrl: string,
  samlIssuer: string,
  samlAcceptedClockSkewMs: number,
  samlAttributeConsumingServiceIndex: number,
  spidAutologin: string,
  spidTestEnvUrl: string,
  IDPMetadataUrl: string,
  hasSpidValidatorEnabled: boolean
  // tslint:disable-next-line: parameters-max-number
) => {
  const idpsMetadataOption = await loadFromRemote(IDPMetadataUrl, IDP_IDS);
  const idpsSpidValidatorOption = hasSpidValidatorEnabled
    ? await loadFromRemote("https://validator.spid.gov.it/metadata.xml", {
        "https://validator.spid.gov.it": "validator"
      })
    : {};

  logSamlCertExpiration(samlCert);

  const options: {
    idp: { [key: string]: IDPOption | undefined };
    // tslint:disable-next-line: no-any
    sp: any;
  } = {
    idp: {
      ...idpsMetadataOption,
      ...idpsSpidValidatorOption,
      xx_servizicie_test: {
        cert: [
          "MIIDdTCCAl2gAwIBAgIUU79XEfveueyClDtLkqUlSPZ2o8owDQYJKoZIhvcNAQELBQAwLTErMCkGA1UEAwwiaWRzZXJ2ZXIuc2Vydml6aWNpZS5pbnRlcm5vLmdvdi5pdDAeFw0xODEwMTkwODM1MDVaFw0zODEwMTkwODM1MDVaMC0xKzApBgNVBAMMImlkc2VydmVyLnNlcnZpemljaWUuaW50ZXJuby5nb3YuaXQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDHraj3iOTCIILTlOzicSEuFt03kKvQDqGWRd5o7s1W7SP2EtcTmg3xron/sbrLEL/eMUQV/Biz6J4pEGoFpMZQHGxOVypmO7Nc8pkFot7yUTApr6Ikuy4cUtbx0g5fkQLNb3upIg0Vg1jSnRXEvUCygr/9EeKCUOi/2ptmOVSLad+dT7TiRsZTwY3FvRWcleDfyYwcIMgz5dLSNLMZqwzQZK1DzvWeD6aGtBKCYPRftacHoESD+6bhukHZ6w95foRMJLOaBpkp+XfugFQioYvrM0AB1YQZ5DCQRhhc8jejwdY+bOB3eZ1lJY7Oannfu6XPW2fcknelyPt7PGf22rNfAgMBAAGjgYwwgYkwHQYDVR0OBBYEFK3Ah+Do3/zB9XjZ66i4biDpUEbAMGgGA1UdEQRhMF+CImlkc2VydmVyLnNlcnZpemljaWUuaW50ZXJuby5nb3YuaXSGOWh0dHBzOi8vaWRzZXJ2ZXIuc2Vydml6aWNpZS5pbnRlcm5vLmdvdi5pdC9pZHAvc2hpYmJvbGV0aDANBgkqhkiG9w0BAQsFAAOCAQEAVtpn/s+lYVf42pAtdgJnGTaSIy8KxHeZobKNYNFEY/XTaZEt9QeV5efUMBVVhxKTTHN0046DR96WFYXs4PJ9Fpyq6Hmy3k/oUdmHJ1c2bwWF/nZ82CwOO081Yg0GBcfPEmKLUGOBK8T55ncW+RSZadvWTyhTtQhLUtLKcWyzKB5aS3kEE5LSzR8sw3owln9P41Mz+QtL3WeNESRHW0qoQkFotYXXW6Rvh69+GyzJLxvq2qd7D1qoJgOMrarshBKKPk+ABaLYoEf/cru4e0RDIp2mD0jkGOGDkn9XUl+3ddALq/osTki6CEawkhiZEo6ABEAjEWNkH9W3/ZzvJnWo6Q=="
        ],
        entityID: "xx_servizicie_test",
        entryPoint:
          "https://idserver.servizicie.interno.gov.it:8443/idp/profile/SAML2/Redirect/SSO",
        logoutUrl: ""
      },
      xx_testenv2: {
        cert: [
          "MIIC7TCCAdWgAwIBAgIJAMbxPOoBth1LMA0GCSqGSIb3DQEBCwUAMA0xCzAJBgNVBAYTAklUMB4XDTE4MDkwNDE0MDAxM1oXDTE4MTAwNDE0MDAxM1owDTELMAkGA1UEBhMCSVQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDJrW3y8Zd2jESPXGMRY04cHC4Qfo3302HEY1C6x1aDfW7aR/tXzNplfdw8ZtZugSSmHZBxVrR8aA08dUVbbtUw5qD0uAWKIeREqGfhM+J1STAMSI2/ZxA6t2fLmv8l1eRd1QGeRDm7yF9EEKGY9iUZD3LJf2mWdVBAzzYlG23M769k+9JuGZxuviNWMjojgYRiQFgzypUJJQz+Ihh3q7LMjjiQiiULVb9vnJg7UdU9Wf3xGRkxk6uiGP9SzWigSObUekYYQ4ZAI/spILywgDxVMMtv/eVniUFKLABtljn5cE9zltECahPbm7wIuMJpDDu5GYHGdYO0j+K7fhjvF2mzAgMBAAGjUDBOMB0GA1UdDgQWBBQEVmzA/L1/fd70ok+6xtDRF8A3HjAfBgNVHSMEGDAWgBQEVmzA/L1/fd70ok+6xtDRF8A3HjAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCRMo4M4PqS0iLTTRWfikMF4hYMapcpmuna6p8aee7CwTjS5y7y18RLvKTi9l8OI0dVkgokH8fq8/o13vMw4feGxro1hMeUilRtH52funrWC+FgPrqk3o/8cZOnq+CqnFFDfILLiEb/PVJMddvTXgv2f9O6u17f8GmMLzde1yvYDa1fG/Pi0fG2F0yw/CmtP8OTLSvxjPtJ+ZckGzZa9GotwHsoVJ+Od21OU2lOeCnOjJOAbewHgqwkCB4O4AT5RM4ThAQtoU8QibjD1XDk/ZbEHdKcofnziDyl0V8gglP2SxpzDaPX0hm4wgHk9BOtSikb72tfOw+pNfeSrZEr6ItQ"
        ],
        entityID: "xx_testenv2",
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
        URL: "https://io.italia.it",
        displayName: "IO - l'app dei servizi pubblici BETA",
        name:
          "Team per la Trasformazione Digitale - Presidenza Del Consiglio dei Ministri"
      },
      privateCert: samlKey,
      signatureAlgorithm: "sha256"
    }
  };

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

/**
 * Reads dates information in x509 certificate and logs remaining time to its expiration date.
 * @param samlCert x509 certificate as string
 */
function logSamlCertExpiration(samlCert: string): void {
  try {
    const out = x509.parseCert(samlCert);
    if (out.notAfter) {
      const timeDiff = distanceInWordsToNow(out.notAfter);
      const warningDate = subDays(new Date(), 60);
      if (isAfter(out.notAfter, warningDate)) {
        log.info("samlCert expire in %s", timeDiff);
      } else if (isAfter(out.notAfter, new Date())) {
        log.warn("samlCert expire in %s", timeDiff);
      } else {
        log.error("samlCert expired from %s", timeDiff);
      }
    } else {
      log.error("Missing expiration date on saml certificate.");
    }
  } catch (e) {
    log.error("Error calculating saml cert expiration: %s", e);
  }
}

export default spidStrategy;
