import { createCanvas } from "canvas";
import * as t from "io-ts";
import * as JsBarcode from "jsbarcode";
import { DOMImplementation, XMLSerializer } from "xmldom";

export const BarcodeOutput = t.interface({
  png: t.string,
  pngMimeType: t.string,
  svg: t.string,
  svgMimeType: t.string
});

export type BarcodeOutput = t.TypeOf<typeof BarcodeOutput>;

export function toBarcode(text: string): BarcodeOutput {
  const xmlSerializer = new XMLSerializer();
  const document = new DOMImplementation().createDocument(
    "http://www.w3.org/1999/xhtml",
    "html",
    null
  );
  const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  JsBarcode(svgNode, text, {
    xmlDocument: document
    // tslint:disable-next-line: no-any
  } as any);

  const svgPlainText = xmlSerializer.serializeToString(svgNode);
  const svgBuffer = Buffer.from(svgPlainText);
  const svg = svgBuffer.toString("base64");
  const canvas = createCanvas(200, 200);
  JsBarcode(canvas, text);
  const png = canvas.toBuffer().toString("base64");
  return {
    png,
    pngMimeType: "image/png",
    svg,
    svgMimeType: "image/svg+xml"
  } as BarcodeOutput;
}
