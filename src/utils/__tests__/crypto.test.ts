import { sha256 } from "../crypto";

describe("sha256", () => {
  test("should be able to generate SHA256 hash for an input", () => {
    const input = "any-input";
    const expected =
      "cc8d2d4b33212f22ff74605c78369429da1d15f413d6f401b98f67d0d361adbd";

    const actual = sha256(input);

    expect(actual).toBe(expected);
  });
});
