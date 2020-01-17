import { isRight } from "fp-ts/lib/Either";
import * as t from "io-ts";

export const dateRegex = /^(?<year>[12]\d{3})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\d|3[01])$/;
const dateRegexGroups = t.interface({
  day: t.string,
  month: t.string,
  year: t.string
});

export const isAdult = (dateOfBirth: string): boolean => {
  const result = dateRegex.exec(dateOfBirth);
  const date = dateRegexGroups.decode(result?.groups);
  if (isRight(date)) {
    const year = Number(date.value.year);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const month = Number(date.value.month);
    const dayNumber = Number(date.value.day);
    const currentDayNumber = currentDate.getDate();
    if (
      year + 18 > currentYear ||
      (year + 18 === currentYear &&
        (currentMonth > month ||
          (currentMonth === month && currentDayNumber > dayNumber)))
    ) {
      return false;
    } else {
      return true;
    }
  }
  return false;
};
