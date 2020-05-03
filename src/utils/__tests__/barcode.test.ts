// tslint:disable-next-line: no-object-mutation
process.env = {
  ...process.env,
  BARCODE_ALGORITHM: "code128"
};

import { isRight } from "fp-ts/lib/Either";
import { toBarcode } from "../barcode";
const aText = "FRLFRC74E04B157I";

describe("Barcode generator", () => {
  it("should return a valid svg and png", async () => {
    const errorOrBarcodes = await toBarcode(aText).run();
    expect(isRight(errorOrBarcodes)).toBeTruthy();
    expect(errorOrBarcodes.value).toMatchSnapshot();
  });
});
