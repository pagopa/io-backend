import * as bwipjs from "bwip-js";
import { sequenceS } from "fp-ts/lib/Apply";
import { tryCatch2v } from "fp-ts/lib/Either";
import { fromNullable } from "fp-ts/lib/Option";
import { fromEither, taskEither, taskify } from "fp-ts/lib/TaskEither";
import { getRequiredENVVar } from "./container";

const BCID = fromNullable(getRequiredENVVar("BARCODE_ALGO_ID")).getOrElse(
  "code128"
);

export interface IBarcodeOutput {
  png: string;
  pngMimeType: string;
  svg: string;
  svgMimeType: string;
}

interface IBwipOptions {
  bcid: string;
  text: string;
}

const toBase64Svg = (options: IBwipOptions) =>
  tryCatch2v(
    () => {
      const drawsvg = require("bwip-js/examples/drawing-svg");
      // tslint:disable-next-line: no-any
      const anyBwipJs = bwipjs as any;
      // see wiki for further informations about fixupOptions https://github.com/metafloor/bwip-js/wiki/Methods-Reference#bwipjsfixupoptions
      anyBwipJs.fixupOptions(options);
      const svg = anyBwipJs.render(
        options,
        drawsvg(options, anyBwipJs.FontLib)
      );
      return Buffer.from(svg).toString("base64");
    },
    errs => new Error(`Cannot generate svg barcode|${errs}`) as Error | string
  );

const toBase64Png = taskify(bwipjs.toBuffer);

export const toBarcode = (text: string) => {
  const options = {
    bcid: BCID,
    text
  };

  return sequenceS(taskEither)({
    png: toBase64Png(options),
    svg: fromEither(toBase64Svg(options))
  })
    .fold<Error | IBarcodeOutput>(
      errorOrString =>
        typeof errorOrString === "string"
          ? new Error(errorOrString)
          : errorOrString,
      images =>
        ({
          png: images.png.toString("base64"),
          pngMimeType: "image/png",
          svg: images.svg,
          svgMimeType: "image/svg+xml"
        } as IBarcodeOutput)
    )
    .run();
};
