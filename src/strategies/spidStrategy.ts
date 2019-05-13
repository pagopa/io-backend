/**
 * Builds and configure a Passport strategy to authenticate the proxy to the
 * different SPID IDPs.
 */
// tslint:disable: no-object-mutation
import * as SpidStrategy from "spid-passport";
import { IDPEntityDescriptor } from "../../generated/backend/IDPEntityDescriptor";
import { SpidUser } from "../types/user";
import { fetchIdpMetadata, parseIdpMetadata } from "../utils/idpLoader";
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
  // tslint:disable-next-line: parameters-max-number
) => {
  // tslint:disable-next-line: no-any
  const options: { idp: { [key: string]: IDPEntityDescriptor }; sp: any } = {
    idp: {
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
        URL: "https://github.com/teamdigitale/italia-backend",
        displayName: "Digital citizenship proxy",
        name: "Digital citizenship proxy"
      },
      privateCert: samlKey,
      signatureAlgorithm: "sha256"
    }
  };

  const IDP_IDS: { [key: string]: string } = {
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

  const idpMetadata = await parseIdpMetadata(
    await fetchIdpMetadata(IDPMetadataUrl)
  );
  idpMetadata.forEach(idp => {
    if (IDP_IDS[idp.entityID]) {
      options.idp[IDP_IDS[idp.entityID]] = idp;
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
