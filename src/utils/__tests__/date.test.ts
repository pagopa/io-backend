import { isOlderThan } from "../date";

const toDate = new Date("2020-01-01");
const olderThanValue = 18;

describe("Check if a birthdate is for an adult user", () => {
  it("should return true if the user has more than 18 years old", () => {
    const validOlderDate = new Date("2000-01-01");
    expect(isOlderThan(olderThanValue)(validOlderDate, toDate)).toBeTruthy();
  });

  it("should return true if the user has exactly 18 years old", () => {
    const validOlderDate = new Date("2002-01-01");
    expect(isOlderThan(olderThanValue)(validOlderDate, toDate)).toBeTruthy();
  });

  it("should return false if the the user has less than 18 years old", () => {
    expect(
      isOlderThan(olderThanValue)(new Date("2002-01-02"), toDate)
    ).toBeFalsy();
  });
});
