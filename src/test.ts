/* eslint-disable no-console */
import { Second } from "@pagopa/ts-commons/lib/units";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { TaskEither, taskify } from "fp-ts/lib/TaskEither";
import * as jwt from "jsonwebtoken";
import { toError } from "fp-ts/lib/Either";

const getJwtMitVoucherToken = (
  privateKey: NonEmptyString,
  fiscalCode: FiscalCode,
  tokenTtl: Second,
  issuer: NonEmptyString,
  audience: NonEmptyString
): TaskEither<Error, string> =>
  taskify<Error, string>(cb =>
    jwt.sign(
      {},
      privateKey,
      {
        algorithm: "ES256",
        audience,
        expiresIn: `${tokenTtl} seconds`,
        issuer,
        subject: fiscalCode
      },
      cb
    )
  )().mapLeft(toError);

const privateKey_mock = `-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIPNKa/mrzj3DHOJiNn6pCY4xpn3VC+8yHbWbM7uuTfGuoAoGCCqGSM49\nAwEHoUQDQgAEC1bQKO9dKObwgKAGv97QMLR9w6IOFIlBGZx7PY0yE+z18xYdKZp/\nC547dDoYKjllfxMTIO0bKfHKPj2bxMiXSQ==\n-----END EC PRIVATE KEY-----` as NonEmptyString;
const audience_mock = "69b3d5a9c935fac3d60c" as NonEmptyString;

getJwtMitVoucherToken(
  privateKey_mock,
  "DROLSS85S20H501F" as FiscalCode,
  3600 as Second,
  "app-backend.io.italia.it" as NonEmptyString,
  audience_mock
)
  .run()
  .then(console.log)
  .catch(console.log);
