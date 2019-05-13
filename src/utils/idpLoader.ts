import nodeFetch from "node-fetch";
import { DOMParser } from "xmldom";
import { log } from "./logger";

export interface IDPMetadataOptions {
  cert: ReadonlyArray<string>;
  entryPoint: string;
  logoutUrl: string;
}

interface IDPMetadataParams extends IDPMetadataOptions {
  entityID: string;
}

export class IDPMetadata {
  public cert: ReadonlyArray<string>;
  public entityID: string;
  public entryPoint: string;
  public logoutUrl: string;
  constructor(params: IDPMetadataParams) {
    this.cert = params.cert;
    this.entityID = params.entityID;
    this.entryPoint = params.entryPoint;
    this.logoutUrl = params.logoutUrl;
  }

  public getIDPOption(): IDPMetadataOptions {
    return {
      cert: Array.from(this.cert),
      entryPoint: this.entityID,
      logoutUrl: this.logoutUrl
    };
  }
}

const EntityDescriptorTAG = "md:EntityDescriptor";
const X509CertificateTAG = "ds:X509Certificate";
const SingleSignOnServiceTAG = "md:SingleSignOnService";
const SingleLogoutServiceTAG = "md:SingleLogoutService";

export async function parseIdpMetadata(
  ipdMetadataPage: string
): Promise<ReadonlyArray<IDPMetadata>> {
  const domParser = new DOMParser().parseFromString(ipdMetadataPage);
  const entityDescriptors = domParser.getElementsByTagName(EntityDescriptorTAG);
  return Array.from(entityDescriptors).reduce(
    (idp: ReadonlyArray<IDPMetadata>, element: Element) => {
      if (validateEntityDescriptorFormat(element)) {
        const elementInfo = new IDPMetadata({
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
        });
        return [...idp, elementInfo];
      }
      return idp;
    },
    []
  );
}

export async function fetchIdpMetadata(
  IDP_METADATA_URL: string
): Promise<string> {
  const idpMetadataRequest = await nodeFetch(IDP_METADATA_URL);
  return await idpMetadataRequest.text();
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
