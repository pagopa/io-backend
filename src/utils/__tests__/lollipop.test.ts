import { aFiscalCode } from "../../__mocks__/user_mock";
import { checkIfLollipopIsEnabled } from "../lollipop";
import * as E from "fp-ts/lib/Either";
import { aRemoteContentConfigurationWithBothEnv } from "../../__mocks__/remote-configuration";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

const aLollipopEnabledFiscalCode = "ABCABC00A00B000C" as FiscalCode;
const aLollipopDisabledFiscalCode = "ABCABC01A00B000C" as FiscalCode;

describe("checkIfLollipopIsEnabled", () => {
  it("Should return true when lollipop is enabled and the user is not in the blacklist", async () => {
    const res = await checkIfLollipopIsEnabled(
      aLollipopEnabledFiscalCode,
      aRemoteContentConfigurationWithBothEnv
    )();

    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toBe(true);
    }
  });

  it("Should return false when lollipop is enabled and the user is in the blacklist", async () => {
    const res = await checkIfLollipopIsEnabled(
      aFiscalCode,
      aRemoteContentConfigurationWithBothEnv
    )();

    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toBe(false);
    }
  });

  it("Should return false when lollipop is disabled and the user is not in the blacklist", async () => {
    const res = await checkIfLollipopIsEnabled(aLollipopEnabledFiscalCode, {
      ...aRemoteContentConfigurationWithBothEnv,
      is_lollipop_enabled: false
    })();

    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toBe(false);
    }
  });

  it("Should return false when lollipop is disabled and the user is in the blacklist", async () => {
    const res = await checkIfLollipopIsEnabled(aLollipopDisabledFiscalCode, {
      ...aRemoteContentConfigurationWithBothEnv,
      is_lollipop_enabled: false
    })();

    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toBe(false);
    }
  });
});
