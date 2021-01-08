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
 * Map a (name, value) tuple from message content prescription data,
 * into an array of "attachments" (named encoded base64 data)
 * containing both the PNG and SVG barcode's representation.
 *
 * @see https://github.com/pagopa/io-functions-commons/blob/master/openapi/definitions.yaml#L91
 */
const toBarcodeAttachments = (name: string, value: string) =>
  toBarcode(value).fold(
    () => [],
    barcodes => [
      { content: barcodes.png, mime_type: MIME_TYPES.png, name },
      { content: barcodes.svg, mime_type: MIME_TYPES.svg, name }
    ]
  );

/**
 * Map prescription data embedded into message content
 * into an array of image attachments, containing
 * the rendered barcode (svg and png) for each field.
 */
export function getPrescriptionAttachments(
  prescriptionData: PrescriptionData
): Task<ReadonlyArray<MessageAttachment>> {
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
