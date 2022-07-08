import { IoCourtesyDigitalAddressActivation } from "../../generated/piattaforma-notifiche-courtesy/IoCourtesyDigitalAddressActivation";
import { PNClientFactory, PNEnvironment } from "../clients/pn-clients";
import { FiscalCode } from "../../generated/backend/FiscalCode";

const upsertPnActivationService = (
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

const getPnActivationService = (
  PnAddressBookIOClientSelector: ReturnType<typeof PNClientFactory>
) => (pnEnvironment: PNEnvironment, fiscalCode: FiscalCode) =>
  PnAddressBookIOClientSelector(pnEnvironment).getCourtesyAddressIo({
    "x-pagopa-cx-taxid": fiscalCode
  });

export const PnService = (
  PnAddressBookIOClientSelector: ReturnType<typeof PNClientFactory>
) => ({
  getPnActivation: getPnActivationService(PnAddressBookIOClientSelector),
  upsertPnActivation: upsertPnActivationService(PnAddressBookIOClientSelector)
});
