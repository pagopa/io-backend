import { pipe } from "fp-ts/lib/function";
import * as RA from "fp-ts/ReadonlyArray";

import { CIE_IDP_IDENTIFIERS } from "@pagopa/io-spid-commons/dist/config";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { SpidUser } from "../types/user";

export const cieProduzioneIdentifier =
  "https://idserver.servizicie.interno.gov.it/idp/profile/SAML2/POST/SSO";

// All CIE Test identifiers
export type CIETestIdentifiers = keyof Omit<
  typeof CIE_IDP_IDENTIFIERS,
  keyof Pick<typeof CIE_IDP_IDENTIFIERS, typeof cieProduzioneIdentifier>
>;

export const isCIETestEnvLogin = (
  issuer: SpidUser["issuer"]
): issuer is CIETestIdentifiers =>
  pipe(
    Object.keys(CIE_IDP_IDENTIFIERS).filter(
      (identifier) => identifier !== cieProduzioneIdentifier
    ),
    RA.some((cieTestIdentifier) => issuer === cieTestIdentifier)
  );

export const getIsUserElegibleForCIETestEnv =
  (cieTestEnvTesters: ReadonlyArray<FiscalCode>) => (fiscalCode: FiscalCode) =>
    cieTestEnvTesters.includes(fiscalCode);
