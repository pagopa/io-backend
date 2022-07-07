import { IoCourtesyDigitalAddressActivation } from "../../generated/piattaforma-notifiche-courtesy/IoCourtesyDigitalAddressActivation";
import { PNClientFactory, PNEnvironment } from "../clients/pn-clients";
import { FiscalCode } from "../../generated/backend/FiscalCode";

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
