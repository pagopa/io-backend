import { flatten } from "fp-ts/lib/Array";
import { PrescriptionData } from "generated/backend/PrescriptionData";
import { CreatedMessageWithContent } from "generated/io-api/CreatedMessageWithContent";
import { toBarcode } from "./barcode";

const MIME_TYPES = {
  png: "image/png",
  svg: "image/svg+xml"
};

const toBarcodeAttachments = async (name: string, value: string) => {
  const errorOrBarcodes = await toBarcode(value);
  return errorOrBarcodes.fold(
    () => [],
    barcodes => [
      { name, content: barcodes.png, mime_type: MIME_TYPES.png },
      { name, content: barcodes.svg, mime_type: MIME_TYPES.svg }
    ]
  );
};

export const getMessageWithAttachments = async (
  message: CreatedMessageWithContent,
  prescriptionData: PrescriptionData
) => {
  const nreArrays = await toBarcodeAttachments("nre", prescriptionData.nre);
  const iupArrays = await toBarcodeAttachments("iup", prescriptionData.iup);
  const prescriberArrays = await toBarcodeAttachments(
    "prescriber_fiscal_code",
    prescriptionData.prescriber_fiscal_code as string
  );
  const attachments = flatten([nreArrays, iupArrays, prescriberArrays]);
  return {
    ...message,
    content: {
      ...message.content,
      attachments
    }
  };
};
