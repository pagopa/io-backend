import { isPdf, getIsFileTypeForTypes, eqFunction } from "../file-type";
import { NON_VALID_PDF, VALID_PDF } from "../__mocks__/pdf_files";

describe("eqFunction", () => {
  it("GIVEN two function with the same body WHEN the equals is called THEN return true", async () => {
    // GIVEN
    const f1 = (_: Buffer) => true;
    const f2 = (_: Buffer) => true;
    // WHEN
    const equal = eqFunction.equals(f1, f2);
    // THEN
    expect(equal).toBeTruthy();
  });

  it("GIVEN two function with the different body WHEN the equals is called THEN return false", async () => {
    // GIVEN
    const f1 = (_: Buffer) => true;
    const f2 = (_: Buffer) => false;
    // WHEN
    const equal = eqFunction.equals(f1, f2);
    // THEN
    expect(equal).toBeFalsy();
  });
});

describe("pdf", () => {
  it("GIVEN a buffer containig a PDF with a valid magic number WHEN the buffer is verified THEN isPdf return true", async () => {
    // GIVEN
    const buffer = Buffer.from(VALID_PDF, "base64");
    // WHEN
    const valid = isPdf(buffer);
    // THEN
    expect(valid).toBeTruthy();
  });

  it("GIVEN a buffer containig a PDF with a not valid magic number WHEN the buffer is verified THEN isPdf return false", async () => {
    // GIVEN
    const buffer = Buffer.from(NON_VALID_PDF, "base64");
    // WHEN
    const valid = isPdf(buffer);
    // THEN
    expect(valid).toBeFalsy();
  });
});

describe("getIsFileTypeForTypes", () => {
  it("GIVEN a buffer containig a PDF with a valid magic number WHEN the buffer is verified for pdf THEN the validator return true", async () => {
    // GIVEN
    const buffer = Buffer.from(VALID_PDF, "base64");
    // WHEN
    const valid = getIsFileTypeForTypes(new Set(["pdf"]))(buffer);
    // THEN
    expect(valid).toBeTruthy();
  });

  it("GIVEN a buffer containig a PDF with a not valid magic number WHEN the buffer is verified for pdf THEN the validator return false", async () => {
    // GIVEN
    const buffer = Buffer.from(NON_VALID_PDF, "base64");
    // WHEN
    const valid = getIsFileTypeForTypes(new Set(["pdf"]))(buffer);
    // THEN
    expect(valid).toBeFalsy();
  });

  it("GIVEN a buffer containig a PDF with a valid magic number WHEN the buffer is verified not for pdf THEN the validator return false", async () => {
    // GIVEN
    const buffer = Buffer.from(VALID_PDF, "base64");
    // WHEN
    const valid = getIsFileTypeForTypes(new Set([]))(buffer);
    // THEN
    expect(valid).toBeFalsy();
  });

  it("GIVEN a buffer containig a PDF with a not valid magic number WHEN the buffer is verified for pdf or any THEN the validator return true", async () => {
    // GIVEN
    const buffer = Buffer.from(NON_VALID_PDF, "base64");
    // WHEN
    const valid = getIsFileTypeForTypes(new Set(["pdf", "any"]))(buffer);
    // THEN
    expect(valid).toBeTruthy();
  });
});
