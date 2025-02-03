import * as AP from "fp-ts/lib/Apply";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { BonusActivationWithQrCode } from "generated/bonus/BonusActivationWithQrCode";
import { BonusActivation } from "generated/io-bonus-api/BonusActivation";
import { image } from "qr-image";

const MIME_TYPES = {
  png: "image/png",
  svg: "image/svg+xml",
};

// Needed to display the SVG into the mobile App
const fixQrcodeFill = (svgStr: string): string =>
  svgStr.replace("<path", '<path fill="black"');

function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, functional/prefer-readonly-type
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line functional/immutable-data
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, functional/prefer-readonly-type
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line functional/immutable-data
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

const streamToBufferTask = (
  stream: NodeJS.ReadableStream
): TaskEither<Error, Buffer> =>
  TE.tryCatch(() => streamToBuffer(stream), E.toError);

const streamToStringTask = (
  stream: NodeJS.ReadableStream
): TaskEither<Error, string> =>
  TE.tryCatch(() => streamToString(stream), E.toError);

export function withQrcode(
  bonus: BonusActivation
): TaskEither<Error, BonusActivationWithQrCode> {
  return pipe(
    AP.sequenceS(TE.ApplicativePar)({
      pngBuffer: streamToBufferTask(image(bonus.id, { type: "png" })),
      svgString: streamToStringTask(image(bonus.id, { type: "svg" })),
    }),
    TE.map(({ pngBuffer, svgString }) => ({
      ...bonus,
      qr_code: [
        {
          content: pngBuffer.toString("base64"),
          mime_type: MIME_TYPES.png,
        },
        {
          content: Buffer.from(fixQrcodeFill(svgString)).toString("base64"),
          mime_type: MIME_TYPES.svg,
        },
      ],
    }))
  );
}
