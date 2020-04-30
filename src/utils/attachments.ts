import { array, flatten } from "fp-ts/lib/Array";
import { task, Task } from "fp-ts/lib/Task";
import { MessageAttachment } from "generated/backend/MessageAttachment";
import { PrescriptionData } from "generated/backend/PrescriptionData";
import { toBarcode } from "./barcode";

const MIME_TYPES = {
  png: "image/png",
  svg: "image/svg+xml"
};

/**
 * For a given field name and value, it returns MessageAttachment[] containing
 * both PNG and SVG barcode's representation.
 * @param name: The name of the field that must be encoded in barcode format
 * @param value: The string value of the field that must be encoded in barcode format
 */
const toBarcodeAttachments = (name: string, value: string) =>
  toBarcode(value).fold(
    () => [],
    barcodes => [
      { name, content: barcodes.png, mime_type: MIME_TYPES.png },
      { name, content: barcodes.svg, mime_type: MIME_TYPES.svg }
    ]
  );

/**
 * It returns an array of MessageAttachment, containing
 * the barcode representation of each PrescriptionData field.
 * @param prescriptionData: The receipt prescription data.
 */
export function getPrescriptionAttachments(
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
