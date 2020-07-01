import { sequenceS } from "fp-ts/lib/Apply";
import { toError } from "fp-ts/lib/Either";
import { taskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { BonusActivationWithQrCode } from "generated/bonus/BonusActivationWithQrCode";
import { BonusActivation } from "generated/io-bonus-api/BonusActivation";
import { image } from "qr-image";

const MIME_TYPES = {
  png: "image/png",
  svg: "image/svg+xml"
};

// Needed to display the SVG into the mobile App
const fixQrcodeFill = (svgStr: string) =>
  svgStr.replace("<path", '<path fill="black"');

function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  // tslint:disable-next-line: readonly-array no-any
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  // tslint:disable-next-line: readonly-array no-any
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

const streamToBufferTask = (stream: NodeJS.ReadableStream) =>
  tryCatch(() => streamToBuffer(stream), toError);

const streamToStringTask = (stream: NodeJS.ReadableStream) =>
  tryCatch(() => streamToString(stream), toError);

export function withQrcode(
  bonus: BonusActivation
): TaskEither<Error, BonusActivationWithQrCode> {
  return sequenceS(taskEither)({
    pngBuffer: streamToBufferTask(image(bonus.id, { type: "png" })),
    svgString: streamToStringTask(image(bonus.id, { type: "svg" }))
  }).map(({ pngBuffer, svgString }) => ({
    ...bonus,
    qr_code: [
      {
        content: pngBuffer.toString("base64"),
        mime_type: MIME_TYPES.png
      },
      {
        content: Buffer.from(fixQrcodeFill(svgString)).toString("base64"),
        mime_type: MIME_TYPES.svg
      }
    ]
  }));
}
