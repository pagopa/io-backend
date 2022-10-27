import { isPdf, getIsFileTypeForTypes } from "../file-type";
import { NON_VALID_PDF, VALID_PDF } from "../__mocks__/pdf_files";

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
    const valid = getIsFileTypeForTypes(["pdf"])(buffer);
    // THEN
    expect(valid).toBeTruthy();
  });

  it("GIVEN a buffer containig a PDF with a not valid magic number WHEN the buffer is verified for pdf THEN the validator return false", async () => {
    // GIVEN
    const buffer = Buffer.from(NON_VALID_PDF, "base64");
    // WHEN
    const valid = getIsFileTypeForTypes(["pdf"])(buffer);
    // THEN
    expect(valid).toBeFalsy();
  });

  it("GIVEN a buffer containig a PDF with a valid magic number WHEN the buffer is verified not for pdf THEN the validator return false", async () => {
    // GIVEN
    const buffer = Buffer.from(VALID_PDF, "base64");
    // WHEN
    const valid = getIsFileTypeForTypes([])(buffer);
    // THEN
    expect(valid).toBeFalsy();
  });
});
