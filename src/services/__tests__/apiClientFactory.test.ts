import { DigitalCitizenshipAPI } from "../../api/digitalCitizenshipAPI";
import { TaxCode } from "../../types/api/TaxCode";
import ApiClient from "../apiClientFactory";

const aTaxCode = "GRBGPP87L04L741X" as TaxCode;

/**
 * Wait for all promises to finish.
 *
 * @returns {Promise<any>}
 */
function flushPromises<T>(): Promise<T> {
  return new Promise(resolve => setImmediate(resolve));
}

describe("apiClient", () => {
  /*test case: mockedApiClient with correct values */
  it("should get a user profile", async () => {
    // generate new DigitalCitizen from client in order to test it
    const client = new ApiClient(aTaxCode, "");
    const spyGetClient = jest.spyOn(client, "getClient");
    const getClient = client.getClient(aTaxCode);

    // check if getClient return the correct type
    const getClientInstance = getClient instanceof DigitalCitizenshipAPI;
    expect(getClientInstance).toBeTruthy();

    // check "getClient" is called
    expect(spyGetClient).toHaveBeenCalled();

    await flushPromises();
  });
});
