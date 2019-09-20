import { DOMParser } from "xmldom";

export interface ISamlResponse {
  RelayState: string;
  SAMLResponse: string;
}

export const getSamlIssuer = (body: ISamlResponse): string => {
  const decodedResponse =
    body && body.SAMLResponse
      ? Buffer.from(body.SAMLResponse, "base64").toString("utf8")
      : "";
  const domParser = new DOMParser().parseFromString(decodedResponse);
  if (domParser === undefined) {
    return "UNKNOWN";
  }
  const samlIssuerTAG = "saml:Issuer";
  const issuer = domParser.getElementsByTagName(samlIssuerTAG).item(0);
  return issuer && issuer.textContent ? issuer.textContent : "UNKNOWN";
};
