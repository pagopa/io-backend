import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { toFiscalCodeHash } from "../notification";

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;

describe("notification type", () => {
  it("should create the correct sha256 hash", async () => {
    const hashed = toFiscalCodeHash(aFiscalCode);

    expect(hashed).toBe(
      "d3f70202fd4d5bd995d6fe996337c1b77b0a4a631203048dafba121d2715ea52"
    );
  });
});
