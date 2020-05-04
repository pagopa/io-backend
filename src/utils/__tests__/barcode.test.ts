// tslint:disable-next-line: no-object-mutation
process.env = {
  ...process.env,
  BARCODE_ALGORITHM: "code128"
};

import { isLeft, isRight } from "fp-ts/lib/Either";
import { toBarcode } from "../barcode";
const aText = "FRLFRC74E04B157I";

describe("Barcode generator", () => {
  it("should return a valid svg and png", async () => {
    const errorOrBarcodes = await toBarcode(aText).run();
    expect(isRight(errorOrBarcodes)).toBeTruthy();
    expect(errorOrBarcodes.value).toMatchSnapshot();
  });
  it("should fail with empty string", async () => {
    const errorOrBarcodes = await toBarcode("").run();
    expect(isLeft(errorOrBarcodes)).toBeTruthy();
  });
});
