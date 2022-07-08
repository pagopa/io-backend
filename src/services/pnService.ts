import { IoCourtesyDigitalAddressActivation } from "../../generated/piattaforma-notifiche-courtesy/IoCourtesyDigitalAddressActivation";
import { PNClientFactory, PNEnvironment } from "../clients/pn-clients";
import { FiscalCode } from "../../generated/backend/FiscalCode";

export const upsertPnActivationService = (
  PnAddressBookIOClientSelector: ReturnType<typeof PNClientFactory>
) => (
  pnEnvironment: PNEnvironment,
  fiscalCode: FiscalCode,
  activationStatusPayload: IoCourtesyDigitalAddressActivation
) =>
  PnAddressBookIOClientSelector(pnEnvironment).setCourtesyAddressIo({
    body: activationStatusPayload,
    "x-pagopa-cx-taxid": fiscalCode
  });

export const getPnActivationService = (
  PnAddressBookIOClientSelector: ReturnType<typeof PNClientFactory>
) => (pnEnvironment: PNEnvironment, fiscalCode: FiscalCode) =>
  PnAddressBookIOClientSelector(pnEnvironment).getCourtesyAddressIo({
    "x-pagopa-cx-taxid": fiscalCode
  });
