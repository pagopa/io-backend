import { BarcodeOutput, toBarcode } from "../barcode";
const aText = "aText";

const aBarcodeOutput: BarcodeOutput = {
  png: "",
  pngMimeType: "image/png",
  svg: "",
  svgMimeType: "image/svg+xml"
};
describe("Barcode generator", () => {
  it("should return a valid svg", () => {
    const output = toBarcode(aText);
    expect(output).toEqual(aBarcodeOutput);
  });
});
