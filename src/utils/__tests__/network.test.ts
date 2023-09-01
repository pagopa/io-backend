// tslint:disable: no-duplicate-string
import { isLeft, right } from "fp-ts/lib/Either";
import { decodeCIDRs, decodeIPAddressFromReq } from "../network";
import mockReq from "../../__mocks__/request";

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

describe("decodeIPAddressFromReq", () => {
  it("should decode an IP v4 ip from express", () => {
    const expectedIpAddress = "10.10.10.1";
    const ret = decodeIPAddressFromReq(mockReq({ ip: expectedIpAddress }));
    expect(ret).toEqual(right(expectedIpAddress));
  });
  it("should decode an IP v6 ip from express", () => {
    const expectedIpAddress = "eff3:459d:93cb:c2d5:179c:8915:357f:f9a9";
    const ret = decodeIPAddressFromReq(mockReq({ ip: expectedIpAddress }));
    expect(ret).toEqual(right(expectedIpAddress));
  });
  it("should return an error if the value is not a valid IP", () => {
    const ret = decodeIPAddressFromReq(mockReq({ ip: "invalidIp" }));
    expect(isLeft(ret)).toBeTruthy();
  });
});
