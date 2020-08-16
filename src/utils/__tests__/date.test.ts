import { isNone, isSome } from "fp-ts/lib/Option";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { formatDate, isOlderThan, toBirthDate } from "../date";

const toDate = new Date("2020-01-01");
const olderThanValue = 18;

const aFiscalCode = "DROLSS85S20H501F" as FiscalCode;
const aWrongFiscalCode = "DROLSS85Z20H501F" as FiscalCode;
const aDateOfBirth = new Date(1985, 10, 20);

describe("Check if a birthdate is for an adult user", () => {
  it("should return true if the user is over 18 years old", () => {
    const validOlderDate = new Date("2000-01-01");
    expect(isOlderThan(olderThanValue)(validOlderDate, toDate)).toBeTruthy();
  });

  it("should return true if the user is exactly 18 years old", () => {
    const validOlderDate = new Date("2002-01-01");
    expect(isOlderThan(olderThanValue)(validOlderDate, toDate)).toBeTruthy();
  });

  it("should return false if the the user has less than 18 years old", () => {
    expect(
      isOlderThan(olderThanValue)(new Date("2002-01-02"), toDate)
    ).toBeFalsy();
  });
});

describe("User utility", () => {
  it("should extract the correct date of birth from fiscalCode", async () => {
    const extractedDateOfBirthOrError = toBirthDate(aFiscalCode);
    expect(isSome(extractedDateOfBirthOrError)).toBeTruthy();
    if (isSome(extractedDateOfBirthOrError)) {
      const birthDate = extractedDateOfBirthOrError.value;
      expect(birthDate.getFullYear()).toEqual(aDateOfBirth.getFullYear());
      expect(birthDate.getDay()).toEqual(aDateOfBirth.getDay());
      expect(birthDate.getMonth()).toEqual(aDateOfBirth.getMonth());
    }
  });

  it("should return none if fiscalCode is not recognized", async () => {
    const extractedDateOfBirthOrError = toBirthDate(aWrongFiscalCode);
    expect(isNone(extractedDateOfBirthOrError)).toBeTruthy();
  });
});

describe("Pad date string", () => {
  it("should pad an invalid format", () => {
    const parsed = formatDate("1980-10-1");
    expect(parsed).toEqual("1980-10-01");
  });
  it("should pad an invalid format", () => {
    const parsed = formatDate("1980-2-3");
    expect(parsed).toEqual("1980-02-03");
  });
});
