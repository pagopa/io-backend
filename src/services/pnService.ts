import nodeFetch from "node-fetch";
import { IoCourtesyDigitalAddressActivation } from "generated/piattaforma-notifiche-courtesy/IoCourtesyDigitalAddressActivation";
import { ValidUrl } from "@pagopa/ts-commons/lib/url";
import { FiscalCode } from "../../generated/backend/FiscalCode";
import { PnAddressBookIOClient } from "../clients/pn-clients";

export enum PNEnvironment {
  PRODUCTION = "PRODUCTION",
  UAT = "UAT",
  DEV = "DEV"
}

export const PNClientFactory = (
  pnApiUrlProd: ValidUrl,
  pnApiKeyProd: string,
  pnApiUrlUAT: ValidUrl,
  pnApiKeyUAT: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
) => (pnEnvironment: PNEnvironment) => {
  switch (pnEnvironment) {
    case PNEnvironment.PRODUCTION:
      return PnAddressBookIOClient(pnApiUrlProd.href, pnApiKeyProd, fetchApi);
    case PNEnvironment.UAT:
      return PnAddressBookIOClient(pnApiUrlUAT.href, pnApiKeyUAT, fetchApi);
    default:
      throw new Error("Unimplemented PN Environment");
  }
};

export const upsertPnServiceActivation = (
  pnEnvironment: PNEnvironment,
  PnAddressBookIOClientSelector: ReturnType<typeof PNClientFactory>,
  fiscalCode: FiscalCode,
  activationStatusPayload: IoCourtesyDigitalAddressActivation
) =>
  PnAddressBookIOClientSelector(pnEnvironment).setCourtesyAddressIo({
    body: activationStatusPayload,
    "x-pagopa-cx-taxid": fiscalCode
  });
