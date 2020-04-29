import * as bwipjs from "bwip-js";
import { sequenceS } from "fp-ts/lib/Apply";
import { Either, left, right, tryCatch2v } from "fp-ts/lib/Either";
import { fromEither, taskEither, taskify } from "fp-ts/lib/TaskEither";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

const BCID = NonEmptyString.decode(process.env.BARCODE_ALGO_ID).getOrElse(
  "code128" as NonEmptyString
);

export interface IBarcodeOutput {
  png: string;
  svg: string;
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

const toBufferPng = taskify(bwipjs.toBuffer);

export const toBarcode = (text: string) => {
  const options = {
    bcid: BCID,
    text
  };

  return sequenceS(taskEither)({
    png: toBufferPng(options),
    svg: fromEither(toBase64Svg(options))
  })
    .fold<Either<Error, IBarcodeOutput>>(
      errorOrString =>
        left(
          typeof errorOrString === "string"
            ? new Error(errorOrString)
            : errorOrString
        ),
      images =>
        right({
          png: images.png.toString("base64"),
          svg: images.svg
        } as IBarcodeOutput)
    )
    .run();
};
