import { TaxCode } from "../api/TaxCode";
import { toTaxCodeHash } from "../notification";

const aTaxCode = "GRBGPP87L04L741X" as TaxCode;

describe("notification type", () => {
  it("should create the correct sha256 hash", async () => {
    const hashed = toTaxCodeHash(aTaxCode);

    expect(hashed).toBe(
      "d3f70202fd4d5bd995d6fe996337c1b77b0a4a631203048dafba121d2715ea52"
    );
  });
});
