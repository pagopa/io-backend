import * as https from "https";
import { DOMParser } from "xmldom";
import { log } from "./utils/logger";

interface IDPMetadata {
  cert: ReadonlyArray<string>;
  entityID: string;
  entryPoint: string;
  logoutUrl: string;
}

const EntityDescriptorTAG = "md:EntityDescriptor";
const X509CertificateTAG = "ds:X509Certificate";
const SingleSignOnServiceTAG = "md:SingleSignOnService";
const SingleLogoutServiceTAG = "md:SingleLogoutService";

export async function parseIdpMetadata(): Promise<ReadonlyArray<IDPMetadata>> {
  const IDP_METADATA_ULR =
    process.env.IDP_METADATA_ULR ||
    "https://registry.spid.gov.it/metadata/idp/spid-entities-idps.xml"; // TODO: remove default configuration?
  const ipdMetadataPage = await getRequest(IDP_METADATA_ULR); // TODO: Failure on download remote configuration will throw an exception
  const domParser = new DOMParser().parseFromString(ipdMetadataPage);
  const entityDescriptors = domParser.getElementsByTagName(EntityDescriptorTAG);
  return Array.from(entityDescriptors).reduce(
    (idp: ReadonlyArray<IDPMetadata>, element: Element) => {
      if (validateEntityDescriptorFormat(element)) {
        const elementInfo = {
          cert: [
            (element
              .getElementsByTagName(X509CertificateTAG)
              .item(0) as Element).textContent as string
          ],
          entityID: element.getAttribute("entityID") as string,
          entryPoint: (element
            .getElementsByTagName(SingleSignOnServiceTAG)
            .item(0) as Element).getAttribute("Location") as string,
          logoutUrl: (element
            .getElementsByTagName(SingleLogoutServiceTAG)
            .item(0) as Element).getAttribute("Location") as string
        };
        return [...idp, elementInfo];
      }
      return idp;
    },
    []
  );
}

function getRequest(url: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    https
      .get(url, res => {
        // tslint:disable-next-line:no-let
        let rawData: string = "";
        res.on("data", d => {
          rawData += d;
        });
        res.on("end", () => {
          try {
            resolve(rawData.toString());
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", e => {
        reject(e);
      });
  });
}

function validateEntityDescriptorFormat(element: Element): boolean {
  if (
    element.getAttribute("entityID") &&
    element.getElementsByTagName(X509CertificateTAG).item(0) &&
    element.getElementsByTagName(SingleSignOnServiceTAG).item(0) &&
    element.getElementsByTagName(SingleLogoutServiceTAG).item(0) &&
    (element.getElementsByTagName(X509CertificateTAG).item(0) as Element)
      .textContent &&
    (element
      .getElementsByTagName(SingleSignOnServiceTAG)
      .item(0) as Element).getAttribute("Location") &&
    (element
      .getElementsByTagName(SingleLogoutServiceTAG)
      .item(0) as Element).getAttribute("Location")
  ) {
    return true;
  }
  log.info("Missing required element into md:EntityDescriptor. Skipping ...");
  return false;
}
