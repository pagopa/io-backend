import { isLeft, isRight } from "fp-ts/lib/Either";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { extractDateOfBirthFromFiscalCodeData } from "../user";

const aFiscalCode = "DROLSS85S20H501F" as FiscalCode;
const aWrongFiscalCode = "DROLSS85Z20H501F" as FiscalCode;
const aDateOfBirth = "1985-11-20";
describe("User utility", () => {
  it("should extract the correct date of birth from fiscalCode", async () => {
    const extractedDateOfBirthOrError = extractDateOfBirthFromFiscalCodeData(
      aFiscalCode
    );
    expect(isRight(extractedDateOfBirthOrError)).toBeTruthy();
    if (isRight(extractedDateOfBirthOrError)) {
      expect(extractedDateOfBirthOrError.value).toEqual(aDateOfBirth);
    }
  });

  it("should returns none if fiscalCode is not recognized", async () => {
    const extractedDateOfBirthOrError = extractDateOfBirthFromFiscalCodeData(
      aWrongFiscalCode
    );
    expect(isLeft(extractedDateOfBirthOrError)).toBeTruthy();
  });
});
