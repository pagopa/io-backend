import { isAdult } from "../date";

const today = new Date();

describe("Check if a birthdate is for an adult user", () => {
  it("should return true if the user has more than 18 years old", () => {
    const validAdultBirthdate = `${today.getFullYear() - 19}-01-01`;
    expect(isAdult(validAdultBirthdate)).toBeTruthy();
  });

  it("should return true if the user has exactly 18 years old", () => {
    const currentMount =
      today.getMonth() + 1 < 10
        ? `0${today.getMonth() + 1}`
        : today.getMonth() + 1;
    const validAdultBirthdate = `${today.getFullYear() -
      18}-${currentMount}-${today.getDate()}`;
    expect(isAdult(validAdultBirthdate)).toBeTruthy();
  });

  it("should return false if the the user has less than 18 years old", () => {
    const currentMount =
      today.getMonth() + 1 < 10
        ? `0${today.getMonth() + 1}`
        : today.getMonth() + 1;
    const validNotAdultBirthdate = `${today.getFullYear() -
      18}-${currentMount}-${today.getDate() - 1}`;
    expect(isAdult(validNotAdultBirthdate)).toBeFalsy();
  });

  it("should return false if the birthdate is invalid", () => {
    expect(isAdult("2000-13-32")).toBeFalsy();
  });
});
