import { addYears, isAfter } from "date-fns";

/**
 * Returns a comparator of two dates that returns true if
 * the difference in years is at least the provided value.
 */
export const isOlderThan = (years: number) => (
  dateOfBirth: Date,
  when: Date
) => {
  return !isAfter(addYears(dateOfBirth, years), when);
};
