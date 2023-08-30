// tslint:disable: no-duplicate-string
import { isLeft, right } from "fp-ts/lib/Either";
import { decodeCIDRs } from "../cidrs";

describe("decodeCIDRs", () => {
  it("should exit when input is undefined", () => {
    const ret = decodeCIDRs("error");
    expect(isLeft(ret)).toBeTruthy();
  });
  it("should decode a plain IP", () => {
    const ret = decodeCIDRs("192.168.1.1");
    expect(ret).toEqual(right(["192.168.1.1/32"]));
  });
  it("should decode a list of plain IPs", () => {
    const ret = decodeCIDRs("192.168.1.1,192.168.2.2");
    expect(ret).toEqual(right(["192.168.1.1/32", "192.168.2.2/32"]));
  });
  it("should decode a plain CIDR", () => {
    const ret = decodeCIDRs("192.168.1.1/24");
    expect(ret).toEqual(right(["192.168.1.1/24"]));
  });
  it("should decode a list of CIDRS", () => {
    const ret = decodeCIDRs("192.168.1.1/24, 192.168.2.2/16, 192.168.3.3/8");
    expect(ret).toEqual(
      right(["192.168.1.1/24", "192.168.2.2/16", "192.168.3.3/8"])
    );
  });
  // tslint:disable-next-line: no-identical-functions
  it("should decode a mixed list of IPs and CIDRS", () => {
    const ret = decodeCIDRs("192.168.1.1, 192.168.2.2, 192.168.3.3/24");
    expect(ret).toEqual(
      right(["192.168.1.1/32", "192.168.2.2/32", "192.168.3.3/24"])
    );
  });
});
