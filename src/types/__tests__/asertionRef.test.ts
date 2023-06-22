import * as E from "fp-ts/Either";

import {
  NullableBackendAssertionRefFromString,
  StoredAssertionRefFromString,
  StoredAssertionRefV2FromString,
} from "../assertionRef";

import { anAssertionRef } from "../../__mocks__/lollipop";

const v2StoredAssertionRef = {
  version: 2,
  assertionRef: anAssertionRef,
};

describe("StoredAssertion|>decode", () => {
  it("should decode a plain assertion Ref", async () => {
    const res = StoredAssertionRefFromString.decode(anAssertionRef);

    expect(res).toEqual(E.right(anAssertionRef));
  });

  it("should decode an assertion ref stored as V2", async () => {
    const res = StoredAssertionRefFromString.decode(
      JSON.stringify(v2StoredAssertionRef)
    );

    expect(res).toEqual(E.right(v2StoredAssertionRef));
  });
});

describe("StoredAssertionRefV2|>is", () => {
  it("should check a StoredAssertionRefV2 from a StoredAssertionRefFromString", async () => {
    const res = StoredAssertionRefFromString.decode(
      JSON.stringify(v2StoredAssertionRef)
    );

    if (E.isRight(res)) {
      expect(StoredAssertionRefV2FromString.is(res.right)).toEqual(true);
    } else {
      fail();
    }
  });

  it("should faill checking a StoredAssertionRefFromString if is not a V2", async () => {
    const res = StoredAssertionRefFromString.decode(anAssertionRef);

    if (E.isRight(res)) {
      expect(StoredAssertionRefV2FromString.is(res.right)).toEqual(false);
    } else {
      fail();
    }
  });
});

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

  it("should decode an assertion ref stored as V2", async () => {
    const expectedResult = v2StoredAssertionRef;

    const res = NullableBackendAssertionRefFromString.decode(
      JSON.stringify(expectedResult)
    );

    expect(res).toEqual(E.right(expectedResult));
  });

  it.each`
    value
    ${"error string"}
    ${JSON.stringify({ version: 1, assertionRef: anAssertionRef })}
  `("should fail decoding $value", async (value) => {
    const res = StoredAssertionRefFromString.decode(value);

    expect(res).toEqual(E.left(expect.any(Object)));
  });
});
