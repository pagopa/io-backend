import * as bwipjs from "bwip-js";
import { ToBufferOptions } from "bwip-js";
import * as AP from "fp-ts/lib/Apply";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { BARCODE_ALGORITHM } from "../../src/config";
import { DrawingSVG } from "./bwipjs-svg";

export interface IBarcodeOutput {
  readonly png: string;
  readonly svg: string;
}

/**
 * Render an SVG from a string representing a barcode
 */
const toBufferSvg = (options: ToBufferOptions) =>
  E.tryCatch(
    () => {
      const opts = { ...options };
      // This method mutate its argument so we make a clone here
      // @see https://github.com/metafloor/bwip-js/wiki/Methods-Reference#bwipjsfixupoptions
      bwipjs.fixupOptions(opts);

      const svg = bwipjs.render(opts, DrawingSVG(opts, bwipjs.FontLib));
      return Buffer.from(svg);
    },
    (errs) => new Error(`Cannot generate svg barcode|${errs}`) as Error | string
  );

/**
 * Render a PNG from a string representing a barcode
 */
const toBufferPng = TE.taskify(bwipjs.toBuffer);

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
    text,
  };
  return pipe(
    AP.sequenceS(TE.ApplicativePar)({
      png: toBufferPng(options),
      svg: TE.fromEither(toBufferSvg(options)),
    }),
    TE.fold(
      (errorOrString) =>
        TE.fromEither(
          E.left(
            typeof errorOrString === "string"
              ? new Error(errorOrString)
              : errorOrString
          )
        ),
      (images) =>
        TE.fromEither(
          E.right({
            png: images.png.toString("base64"),
            svg: images.svg.toString("base64"),
          })
        )
    )
  );
}
