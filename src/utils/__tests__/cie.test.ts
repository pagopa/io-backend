import {
  CIE_IDP_IDENTIFIERS,
  Issuer,
} from "@pagopa/io-spid-commons/dist/config";

import { cieProduzioneIdentifier, isCIETestEnvLogin } from "../cie";

describe("isCIETestEnvLogin", () => {
  Object.keys(CIE_IDP_IDENTIFIERS)
    .filter((identifier) => identifier !== cieProduzioneIdentifier)
    .forEach((env) => {
      it(`should return true if issuer is a CIE test env: ${env}`, () => {
        expect(isCIETestEnvLogin(env as any)).toEqual(true);
      });
    });

  it(`should return false if issuer is CIE production env`, () => {
    expect(isCIETestEnvLogin(cieProduzioneIdentifier as any)).toEqual(false);
  });

  it(`should return false if issuer is not a CIE env`, () => {
    const anotherIssuer: Issuer = "https://id.eht.eu";
    expect(isCIETestEnvLogin(anotherIssuer)).toEqual(false);
  });
});
