import { errorsToReadableMessages } from "italia-ts-commons/lib/reporters";
import nodeFetch from "node-fetch";
import { DOMParser } from "xmldom";
import { IDPEntityDescriptor } from "../types/IDPEntityDescriptor";
import { log } from "./logger";

const EntityDescriptorTAG = "md:EntityDescriptor";
const X509CertificateTAG = "ds:X509Certificate";
const SingleSignOnServiceTAG = "md:SingleSignOnService";
const SingleLogoutServiceTAG = "md:SingleLogoutService";

/**
 * Parse a string that represents an XML file containing the ipd Metadata and converts it into an array of IDPEntityDescriptor
 * Required namespace definitions into the XML are xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" and xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
 * An example file is provided in /test_idps/spid-entities-idps.xml of this project.
 */
export function parseIdpMetadata(
  ipdMetadataPage: string
): ReadonlyArray<IDPEntityDescriptor> {
  const domParser = new DOMParser().parseFromString(ipdMetadataPage);
  const entityDescriptors = domParser.getElementsByTagName(EntityDescriptorTAG);
  return Array.from(entityDescriptors).reduce(
    (idps: ReadonlyArray<IDPEntityDescriptor>, element: Element) => {
      const certs = Array.from(
        element.getElementsByTagName(X509CertificateTAG)
      ).map(_ => {
        if (_.textContent) {
          return _.textContent.replace(/[\n\s]/g, "");
        }
        return "";
      });
      try {
        const elementInfoOrErrors = IDPEntityDescriptor.decode({
          cert: certs,
          entityID: element.getAttribute("entityID"),
          entryPoint: Array.from(
            element.getElementsByTagName(SingleSignOnServiceTAG)
          )
            .filter(
              _ =>
                _.getAttribute("Binding") ===
                "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            )[0]
            .getAttribute("Location"),
          logoutUrl: Array.from(
            element.getElementsByTagName(SingleLogoutServiceTAG)
          )
            .filter(
              _ =>
                _.getAttribute("Binding") ===
                "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            )[0]
            .getAttribute("Location")
        });
        if (elementInfoOrErrors.isLeft()) {
          log.warn(
            "Invalid md:EntityDescriptor. %s",
            errorsToReadableMessages(elementInfoOrErrors.value).join(" / ")
          );
          return idps;
        }
        return [...idps, elementInfoOrErrors.value];
      } catch {
        log.warn(
          "Invalid md:EntityDescriptor. %s",
          new Error("Unable to parse element info")
        );
        return idps;
      }
    },
    []
  );
}

/**
 * Fetch an ipds Metadata XML file from a remote url and convert it into a string
 */
export async function fetchIdpMetadata(
  idpMetadataUrl: string
): Promise<string> {
  const idpMetadataRequest = await nodeFetch(idpMetadataUrl);
  return await idpMetadataRequest.text();
}

export interface IDPOption {
  // tslint:disable-next-line: readonly-array
  cert: string[];
  entityID: string;
  entryPoint: string;
  logoutUrl: string;
}

/**
 * Map provided idpMetadata in an object with idp key whitelisted in ipdIds.
 * Mapping is based on entityID property
 */
export const mapIpdMetadata = (
  idpMetadata: ReadonlyArray<IDPEntityDescriptor>,
  idpIds: { [key: string]: string | undefined }
) =>
  idpMetadata.reduce(
    (prev, idp) => {
      const idpKey = idpIds[idp.entityID];
      const idpOption = {
        ...idp,
        cert: idp.cert.toArray()
      };
      if (idpKey) {
        return { ...prev, [idpKey]: idpOption };
      }
      log.warn(
        `Unsupported SPID idp from metadata repository [${idp.entityID}]`
      );
      return prev;
    },
    {} as { [key: string]: IDPOption | undefined }
  );
