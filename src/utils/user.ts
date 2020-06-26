import { format } from "date-fns";
import { Either, tryCatch2v } from "fp-ts/lib/Either";
import { FiscalCode } from "generated/backend/FiscalCode";
import { isValidDate } from "./date";

const months: { [k: string]: number } = {
  ["A"]: 1,
  ["B"]: 2,
  ["C"]: 3,
  ["D"]: 4,
  ["E"]: 5,
  ["H"]: 6,
  ["L"]: 7,
  ["M"]: 8,
  ["P"]: 9,
  ["R"]: 10,
  ["S"]: 11,
  ["T"]: 12
};

// Generate object including data expressed into the given fiscal code
export function extractDateOfBirthFromFiscalCodeData(
  fiscalCode: FiscalCode
): Either<Error, string> {
  return tryCatch2v(
    () => {
      const tempDay = parseInt(fiscalCode.substring(9, 11), 10);
      const month = months[fiscalCode.charAt(8)];

      const day = tempDay - 40 > 0 ? tempDay - 40 : tempDay;
      const tempYear = parseInt(fiscalCode.substring(6, 8), 10);
      // to avoid the century date collision (01 could mean 1901 or 2001)
      // we assume that if the birth date is grater than a century, the date
      // refers to the new century
      const year =
        tempYear +
        (new Date().getFullYear() - (1900 + tempYear) >= 100 ? 2000 : 1900);
      const dateOfBirth = new Date(year, month - 1, day); // months are 0-index
      if (isValidDate(dateOfBirth)) {
        return format(dateOfBirth, "YYYY-MM-DD");
      } else {
        throw new Error("Invalid Date parsed from Fiscal Code");
      }
    },
    _ => new Error("Could not extract date of birth from Fiscal Code")
  );
}
