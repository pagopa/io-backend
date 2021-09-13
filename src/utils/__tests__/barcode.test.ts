// tslint:disable-next-line: no-object-mutation
process.env = {
  ...process.env,
  BARCODE_ALGORITHM: "code128"
};

import * as E from "fp-ts/lib/Either";
import { toBarcode } from "../barcode";
const aText = "FRLFRC74E04B157I";

describe("Barcode generator", () => {
  it("should return a valid svg and png", async () => {
    const errorOrBarcodes = await toBarcode(aText)();
    expect(E.isRight(errorOrBarcodes)).toBeTruthy();
    if (E.isRight(errorOrBarcodes)) {
      expect(errorOrBarcodes.right).toMatchSnapshot();
    }
  });
  it("should fail with empty string", async () => {
    const errorOrBarcodes = await toBarcode("")();
    expect(E.isLeft(errorOrBarcodes)).toBeTruthy();
  });
});
