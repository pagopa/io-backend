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

const base64 = (s: string) => Buffer.from(s).toString("base64");

function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  // tslint:disable-next-line: readonly-array no-any
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

const streamToStringTask = (stream: NodeJS.ReadableStream) =>
  tryCatch(() => streamToString(stream), toError);

export function withQrcode(
  bonus: BonusActivation
): TaskEither<Error, BonusActivationWithQrCode> {
  return sequenceS(taskEither)({
    png: streamToStringTask(image(bonus.id, { type: "png" })),
    svg: streamToStringTask(image(bonus.id, { type: "svg" }))
  }).map(({ png, svg }) => ({
    ...bonus,
    qr_code: [
      {
        content: base64(png),
        mime_type: MIME_TYPES.png
      },
      {
        content: base64(svg),
        mime_type: MIME_TYPES.svg
      }
    ]
  }));
}
