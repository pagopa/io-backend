import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import * as T from "fp-ts/lib/Task";
import { Task } from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { MessageAttachment } from "generated/backend/MessageAttachment";
import { PrescriptionData } from "generated/backend/PrescriptionData";
import { toBarcode } from "./barcode";

const MIME_TYPES = {
  png: "image/png",
  svg: "image/svg+xml",
};

/**
 * Map a (name, value) tuple from message content prescription data,
 * into an array of "attachments" (named encoded base64 data)
 * containing both the PNG and SVG barcode's representation.
 *
 * @see https://github.com/pagopa/io-functions-commons/blob/master/openapi/definitions.yaml#L91
 */
const toBarcodeAttachments = (name: string, value: string) =>
  pipe(
    toBarcode(value),
    TE.map((barcodes) => [
      { content: barcodes.png, mime_type: MIME_TYPES.png, name },
      { content: barcodes.svg, mime_type: MIME_TYPES.svg, name },
    ]),
    TE.mapLeft(() => []),
    TE.toUnion
  );

/**
 * Map prescription data embedded into message content
 * into an array of image attachments, containing
 * the rendered barcode (svg and png) for each field.
 */
export function getPrescriptionAttachments(
  prescriptionData: PrescriptionData
): Task<ReadonlyArray<MessageAttachment>> {
  return pipe(
    A.sequence(T.ApplicativePar)([
      toBarcodeAttachments("iup", prescriptionData.iup),
      toBarcodeAttachments("nre", prescriptionData.nre),
      toBarcodeAttachments(
        "prescriber_fiscal_code",
        prescriptionData.prescriber_fiscal_code as string
      ),
    ]),
    T.map(A.flatten)
  );
}
