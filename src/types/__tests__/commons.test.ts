import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";

import { fallback, jsonFromString } from "../commons";

describe("JSONFromString", () => {
  it("should decode a valid Json", () => {
    const aValidJson = {
      field1: "aValue",
      field2: 42,
      field3: [4, 5]
    };

    const decoded = jsonFromString.decode(JSON.stringify(aValidJson));

    expect(E.isRight(decoded)).toBeTruthy();

    if (E.isRight(decoded)) {
      expect(decoded.value).toEqual(aValidJson);
    }
  });

  it("should fail decoding an invalid Json", () => {
    const aValidJson = {
      field1: "aValue",
      field2: 42,
      field3: [4, 5]
    };

    const decoded = jsonFromString.decode(JSON.stringify(aValidJson).slice(2));

    expect(E.isLeft(decoded)).toBeTruthy();

    if (E.isLeft(decoded)) {
      expect(decoded.value[0].message).toEqual(
        "Error parsing the string into a valid JSON"
      );
    }
  });
});

describe("fallback", () => {
  it("should return fallback value in case of decoding failure", () => {
    const aCodecWithFallback = fallback(t.number)(42);

    const decoded = aCodecWithFallback.decode("aWrongValue");

    expect(E.isRight(decoded));
    expect((decoded as E.Right<any, number>).value).toEqual(42);
  });

  it("should return decoded value in case no decoding failures happened", () => {
    const aCodecWithFallback = fallback(t.number)(42);

    const decoded = aCodecWithFallback.decode(14);

    expect(E.isRight(decoded));
    expect((decoded as E.Right<any, number>).value).toEqual(14);
  });
});
