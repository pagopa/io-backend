import * as bwipjs from "bwip-js";
import { ToBufferOptions } from "bwip-js";
import { sequenceS } from "fp-ts/lib/Apply";
import { left, right, tryCatch2v } from "fp-ts/lib/Either";
import {
  fromEither,
  taskEither,
  TaskEither,
  taskify
} from "fp-ts/lib/TaskEither";
import { BARCODE_ALGORITHM } from "../../src/config";
import { DrawingSVG } from "./bwipjs-svg";

export interface IBarcodeOutput {
  png: string;
  svg: string;
}

/**
 * Render an SVG from a string representing a barcode
 */
const toBufferSvg = (options: ToBufferOptions) =>
  tryCatch2v(
    () => {
      const opts = { ...options };
      // This method mutate its argument so we make a clone here
      // @see https://github.com/metafloor/bwip-js/wiki/Methods-Reference#bwipjsfixupoptions
      bwipjs.fixupOptions(opts);

      const svg = bwipjs.render(opts, DrawingSVG(opts, bwipjs.FontLib));
      return Buffer.from(svg);
    },
    errs => new Error(`Cannot generate svg barcode|${errs}`) as Error | string
  );

/**
 * Render a PNG from a string representing a barcode
 */
const toBufferPng = taskify(bwipjs.toBuffer);

/**
 * Render a tuple (base64-encoded SVG, base64-encoded PNG)
 * from a string representing a barcode.
 */
export function toBarcode(
  text: string,
  bcid = BARCODE_ALGORITHM
): TaskEither<Error, IBarcodeOutput> {
  const options = {
    bcid,
    text
  };
  return sequenceS(taskEither)({
    png: toBufferPng(options),
    svg: fromEither(toBufferSvg(options))
  }).foldTaskEither(
    errorOrString =>
      fromEither(
        left(
          typeof errorOrString === "string"
            ? new Error(errorOrString)
            : errorOrString
        )
      ),
    images =>
      fromEither(
        right({
          png: images.png.toString("base64"),
          svg: images.svg.toString("base64")
        })
      )
  );
}
