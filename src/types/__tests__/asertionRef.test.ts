import * as E from "fp-ts/Either";

import { LoginTypeEnum } from "../../utils/fastLogin";

import {
  LollipopData,
  LollipopDataFromString,
  NullableBackendAssertionRefFromString,
} from "../assertionRef";

import { anAssertionRef } from "../../__mocks__/lollipop";

const lvStoredLollipopData = {
  a: anAssertionRef,
  t: LoginTypeEnum.LV,
};

const lvExtendedLollipopData: LollipopData = {
  assertionRef: lvStoredLollipopData.a,
  loginType: lvStoredLollipopData.t,
};

describe("NullableBackendAssertionRef|>decode", () => {
  it("should decode null value", async () => {
    const res = NullableBackendAssertionRefFromString.decode(null);

    expect(res).toEqual(E.right(null));
  });

  it("should decode undefined", async () => {
    const res = NullableBackendAssertionRefFromString.decode(undefined);

    expect(res).toEqual(E.right(undefined));
  });

  it("should decode a plain assertion Ref", async () => {
    const res = NullableBackendAssertionRefFromString.decode(anAssertionRef);

    expect(res).toEqual(E.right(anAssertionRef));
  });

  it("should decode an assertion ref stored in new format", async () => {
    const expectedResult = lvStoredLollipopData;

    const res = NullableBackendAssertionRefFromString.decode(
      JSON.stringify(expectedResult)
    );

    expect(res).toEqual(E.right(lvExtendedLollipopData));
  });

  it.each`
    value
    ${"error string"}
    ${JSON.stringify({ version: 1, assertionRef: anAssertionRef })}
  `("should fail decoding $value", async (value) => {
    const res = NullableBackendAssertionRefFromString.decode(value);

    expect(res).toEqual(E.left(expect.any(Object)));
  });
});

describe("LollipopDataFromString|>encode", () => {
  it("should encode a valid LollipopData", async () => {
    const res = LollipopDataFromString.encode(lvExtendedLollipopData);

    expect(res).toEqual(JSON.stringify(lvStoredLollipopData));
  });
});

describe("LollipopData|>is", () => {
  it("should check a LollipopData from a LollipopDataFromString", async () => {
    const res = NullableBackendAssertionRefFromString.decode(
      JSON.stringify(lvStoredLollipopData)
    );

    if (E.isRight(res)) {
      expect(LollipopData.is(res.right)).toEqual(true);
    } else {
      fail();
    }
  });

  it("should faill checking a LollipopDataFromString if it's not in new format", async () => {
    const res = NullableBackendAssertionRefFromString.decode(anAssertionRef);

    if (E.isRight(res)) {
      expect(LollipopData.is(res.right)).toEqual(false);
    } else {
      fail();
    }
  });
});
