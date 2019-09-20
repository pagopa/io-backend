import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { DOMParser } from "xmldom";

const SAMLResponse = t.type({
  RelayState: t.string,
  SAMLResponse: t.string
});
export type SAMLResponse = t.TypeOf<typeof SAMLResponse>;

export const getSamlIssuer = (body: unknown): string => {
  const samlResponseOrError = SAMLResponse.decode(body);
  if (isLeft(samlResponseOrError)) {
    return "UNKNOWN";
  }
  const decodedResponse = Buffer.from(
    samlResponseOrError.value.SAMLResponse,
    "base64"
  ).toString("utf8");
  const domParser = new DOMParser().parseFromString(decodedResponse);
  if (domParser === undefined) {
    return "UNKNOWN";
  }
  const samlIssuerTAG = "saml:Issuer";
  const issuer = domParser.getElementsByTagName(samlIssuerTAG).item(0);
  return issuer && issuer.textContent ? issuer.textContent : "UNKNOWN";
};
