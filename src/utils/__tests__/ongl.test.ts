import { set, nestifyPrefixedType, ognlTypeFor } from "../ognl";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";

const dummyEnv = {
  OTHERS: "others env properties",
  PREFIX_id: "dummy_id",
  PREFIX_name: "dummy_name",
  PREFIX_inner_id: "dummy_inner_id"
};

const dummyNestedEnv = {
  id: "dummy_id",
  name: "dummy_name",
  inner: { id: "dummy_inner_id" }
};

const dummyTypeDecoded = {
  id: "dummy_id",
  name: "dummy_name",
  inner: { id: "dummy_inner_id" }
};

type dummyType = t.Type<typeof dummyType>;
const dummyType = t.interface({
  id: t.string,
  name: t.string,
  inner: t.interface({ id: t.string })
});

describe("set", () => {
  it(`set a value from string`, async () => {
    // Demo
    let obj = {};
    set(obj, "test.field", "value");
    expect(obj).toEqual({ test: { field: "value" } });
  });
});

describe("ognl", () => {
  it("GIVEN an env containing also properties in the format PREFIX<field_path> WHEN nestifyPrefixedType is called THEN an object with <field_path> as nested field is returned", () => {
    const processed = nestifyPrefixedType(dummyEnv, "PREFIX");
    expect(processed).toStrictEqual(dummyNestedEnv);
  });

  it("GIVEN a not valid dummyType configuration WHEN the decode is called THEN a left either is returned", () => {
    const decoded = ognlTypeFor(dummyType, "PREFIX").decode({
      PREFIX_wrong: "wrong"
    });
    expect(E.isLeft(decoded)).toBeTruthy();
  });

  it("GIVEN a valid dummyType configuration WHEN the ognl decode is called THEN a right either is returned", () => {
    const decoded = ognlTypeFor(dummyType, "PREFIX").decode(dummyEnv);
    expect(E.isRight(decoded)).toBeTruthy();
    if (E.isRight(decoded)) {
      expect(decoded.right).toStrictEqual(dummyTypeDecoded);
    }
  });
});
