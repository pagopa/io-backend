import { array, flatten } from "fp-ts/lib/Array";
import { task, Task } from "fp-ts/lib/Task";
import { MessageAttachment } from "generated/backend/MessageAttachment";
import { PrescriptionData } from "generated/backend/PrescriptionData";
import { toBarcode } from "./barcode";

const MIME_TYPES = {
  png: "image/png",
  svg: "image/svg+xml"
};

const toBarcodeAttachments = (name: string, value: string) => {
  const errorOrBarcodes = toBarcode(value);
  return errorOrBarcodes.fold(
    () => [],
    barcodes => [
      { name, content: barcodes.png, mime_type: MIME_TYPES.png },
      { name, content: barcodes.svg, mime_type: MIME_TYPES.svg }
    ]
  );
};

export function getAttachments(
  prescriptionData: PrescriptionData
  // tslint:disable-next-line: readonly-array
): Task<MessageAttachment[]> {
  return array
    .sequence(task)([
      toBarcodeAttachments("iup", prescriptionData.iup),
      toBarcodeAttachments("nre", prescriptionData.nre),
      toBarcodeAttachments(
        "prescriber_fiscal_code",
        prescriptionData.prescriber_fiscal_code as string
      )
    ])
    .map(flatten);
}
