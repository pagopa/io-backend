import { FiscalCode } from "../api/FiscalCode";
import { toFiscalCodeHash } from "../notification";

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;

describe("notification type", () => {
  it("should create the correct sha256 hash", async () => {
    const hashed = toFiscalCodeHash(aFiscalCode);

    expect(hashed).toBe("0/cCAv1NW9mV1v6ZYzfBt3sKSmMSAwSNr7oSHScV6lI=");
  });
});
