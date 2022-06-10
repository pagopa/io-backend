import { PatternString } from "@pagopa/ts-commons/lib/strings";
import { addYears, format, isAfter } from "date-fns";
import { Option, tryCatch } from "fp-ts/lib/Option";
import { FiscalCode } from "generated/backend/FiscalCode";
import * as t from "io-ts";

/**
 * Returns a comparator of two dates that returns true if
 * the difference in years is at least the provided value.
 */
export const isOlderThan = (years: number) => (dateOfBirth: Date, when: Date) =>
  !isAfter(addYears(dateOfBirth, years), when);

export const isValidDate = (d: Date) =>
  d instanceof Date && !isNaN(d.getTime());

const months: { readonly [k: string]: number } = {
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

/**
 * Parse birth date from fiscal code
 */
export function toBirthDate(fiscalCode: FiscalCode): Option<Date> {
  return tryCatch(() => {
    const tempDay = parseInt(fiscalCode.substring(9, 11), 10);
    if (isNaN(tempDay)) {
      throw new Error();
    }

    const monthIndx = fiscalCode.charAt(8);
    if (!(monthIndx in months)) {
      throw new Error();
    }

    const month = months[fiscalCode.charAt(8)];

    // female subjects have 40 added to their birth day
    const day = tempDay - 40 > 0 ? tempDay - 40 : tempDay;

    const tempYear = parseInt(fiscalCode.substring(6, 8), 10);
    if (isNaN(tempYear)) {
      throw new Error();
    }

    // to avoid the century date collision (01 could mean 1901 or 2001)
    // we assume that if the birth date is grater than a century, the date
    // refers to the new century
    const year =
      tempYear +
      (new Date().getFullYear() - (1900 + tempYear) >= 100 ? 2000 : 1900);

    // months are 0-index
    const birthDay = new Date(year, month - 1, day);
    if (!isValidDate(birthDay)) {
      throw new Error();
    }

    return birthDay;
  });
}

/**
 * Returns a formatted date.
 *
 * ie. convert 1980-13-1 to 1980-13-01
 */
export function formatDate(dateStr: string): string {
  return format(dateStr, "YYYY-MM-DD");
}

const isDate = (v: t.mixed): v is Date => v instanceof Date;

/**
 * ISO8601 format for dates.
 *
 * Date and time is separated with a capital T.
 * UTC time is defined with +/-00:00 format
 *
 */
const STRICT_UTC_ISO8601_FULL_REGEX = PatternString(
  "^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d(\\.\\d+)?[+-](\\d{2})\\:(\\d{2})$"
);
// 2021-12-22T10:56:03+01:00
/**
 * Accepts an ISO8601 format with UTC (+/-) timezone
 *
 * ie. "2018-10-13T00:00:00.000:+01:00"
 */
export const StrictUTCISODateFromString = new t.Type<Date, string>(
  "StrictUTCISODateFromString",
  isDate,
  (v, c) =>
    isDate(v)
      ? t.success(v)
      : STRICT_UTC_ISO8601_FULL_REGEX.validate(v, c).chain(s => {
          const d = new Date(s);
          return isNaN(d.getTime()) ? t.failure(s, c) : t.success(d);
        }),
  a => a.toISOString()
);

export type StrictUTCISODateFromString = t.TypeOf<
  typeof StrictUTCISODateFromString
>;
