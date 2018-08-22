import { APIClient } from "../../clients/api";
import ApiClient from "../apiClientFactory";

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
    const client = new ApiClient("", "");
    const spyGetClient = jest.spyOn(client, "getClient");
    const getClient = client.getClient();

    // check if getClient return the correct type
    const getClientInstance = getClient instanceof APIClient;
    expect(getClientInstance).toBeTruthy();

    // check "getClient" is called
    expect(spyGetClient).toHaveBeenCalled();

    await flushPromises();
  });
});
