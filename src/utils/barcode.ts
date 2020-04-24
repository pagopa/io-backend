import * as bwipjs from "bwip-js";
import { tryCatch } from "fp-ts/lib/TaskEither";
import * as JsBarcode from "jsbarcode";
import { DOMImplementation, XMLSerializer } from "xmldom";

export interface IBarcodeOutput {
  png: string;
  pngMimeType: string;
  svg: string;
  svgMimeType: string;
}

interface IBwipOptions {
  bcid: string;
  text: string;
  includetext: boolean;
}

const toBase64Png = (options: IBwipOptions) => {
  return tryCatch(
    () => {
      return new Promise<string>((resolve, reject) =>
        bwipjs.toBuffer(options, (err, png) => {
          if (err == null) {
            return resolve(png.toString("base64"));
          } else {
            return reject(new Error("Cannot generate png barcode"));
          }
        })
      );
    },
    errs => new Error(`Cannot generate png barcode|${errs}`)
  );
};

const toBase64Svg = (text: string) => {
  return tryCatch(
    () => {
      return new Promise<string>(resolve => {
        const xmlSerializer = new XMLSerializer();
        const document = new DOMImplementation().createDocument(
          "http://www.w3.org/1999/xhtml",
          "html",
          null
        );
        const svgNode = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );

        JsBarcode(svgNode, text, {
          xmlDocument: document
          // tslint:disable-next-line: no-any
        } as any);

        const svgPlainText = xmlSerializer.serializeToString(svgNode);
        const svgBuffer = Buffer.from(svgPlainText);
        const svg = svgBuffer.toString("base64");
        return resolve(svg);
      });
    },
    errs => new Error(`Cannot generate svg barcode|${errs}`)
  );
};

export async function toBarcode(text: string): Promise<Error | IBarcodeOutput> {
  const options = {
    bcid: "code128",
    includetext: true,
    text
  };

  const errorOrSvg = await toBase64Svg(text).run();
  const errorOrPng = await toBase64Png(options).run();
  return {
    png: errorOrPng.getOrElse(""),
    pngMimeType: "image/png",
    svg: errorOrSvg.getOrElse(""),
    svgMimeType: "image/svg+xml"
  };
}
