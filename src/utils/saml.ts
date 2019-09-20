import { DOMParser } from "xmldom";

export interface ISamlResponse {
  RelayState: string;
  SAMLResponse: string;
}

export const getSamlIssuer = (body: ISamlResponse): string | undefined => {
  const decodedResponse =
    body && body.SAMLResponse
      ? Buffer.from(body.SAMLResponse, "base64").toString("utf8")
      : "";
  const domParser = new DOMParser().parseFromString(decodedResponse);
  if (domParser === undefined) {
    return undefined;
  }
  const samlIssuerTAG = "saml:Issuer";
  const samlIssuerElements = domParser.getElementsByTagName(samlIssuerTAG);
  const issuers = Array.from(samlIssuerElements).map(_ => _.textContent);
  return issuers[0] ? issuers[0] : undefined;
};
