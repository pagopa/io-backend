import { flatten } from "fp-ts/lib/Array";
import { PrescriptionData } from "generated/backend/PrescriptionData";
import { CreatedMessageWithContent } from "generated/io-api/CreatedMessageWithContent";
import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { toBarcode } from "./barcode";

const toMessageAttachments = async (name: string, value: string) => {
  const errorOrBarcodes = await toBarcode(value);
  return errorOrBarcodes.fold(
    () => [],
    barcodes => [
      { name, content: barcodes.png, mime_type: barcodes.pngMimeType },
      { name, content: barcodes.svg, mime_type: barcodes.svgMimeType }
    ]
  );
};

export const fillMessageAttachmentsPayload = async (
  message: CreatedMessageWithContent,
  prescriptionData: PrescriptionData
) => {
  const nreArrays = await toMessageAttachments("nre", prescriptionData.nre);
  const iupArrays = await toMessageAttachments("iup", prescriptionData.iup);
  const prescriberArrays = await toMessageAttachments(
    "prescriber_fiscal_code",
    prescriptionData.prescriber_fiscal_code as string
  );
  const attachments = flatten([nreArrays, iupArrays, prescriberArrays]);
  return ResponseSuccessJson({
    ...message,
    content: {
      ...message.content,
      attachments
    }
  });
};
