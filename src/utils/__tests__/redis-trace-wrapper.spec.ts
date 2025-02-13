import { createWrappedRedisClusterClient } from "../redis-trace-wrapper";
import { mockedAppinsightsTelemetryClient, mockTrackDependency } from "../__mocks__/appinsights.mocks";


const mockedAppInsightsClient = mockedAppinsightsTelemetryClient;

const mockGet = jest.fn(async () => "42");

jest.mock("redis", () => ({
  createCluster: () => ({
    get: mockGet,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createWrappedRedisClusterClient |> trace enabled", () => {
  const wrappedClient = createWrappedRedisClusterClient(
    {} as any,
    "TEST",
    mockedAppInsightsClient,
  );

  it("should call `trackDependency` when the request completed successfully", async () => {
    const result = await wrappedClient.get("TEST");

    expect(result).toEqual("42");
    expect(mockTrackDependency).toHaveBeenCalledWith({
      target: "Redis Cluster - TEST",
      name: "get",
      data: "",
      resultCode: "",
      duration: expect.any(Number),
      success: true,
      dependencyTypeName: "REDIS",
    });
  });

  test("should call `trackDependency` when the request failed", async () => {
    mockGet.mockRejectedValueOnce({});

    try {
      await wrappedClient.get("TEST");
    } catch (e) {}

    expect(mockTrackDependency).toHaveBeenCalledWith({
      target: "Redis Cluster - TEST",
      name: "get",
      data: "",
      resultCode: "ERROR",
      duration: expect.any(Number),
      success: false,
      dependencyTypeName: "REDIS",
    });
  });
});

describe("createWrappedRedisClusterClient |> trace disabled", () => {
  const wrappedClient = createWrappedRedisClusterClient(
    {} as any,
    "TEST",
  );

  test("should NOT call `trackDependency` when the request completed successfully", async () => {
    const result = await wrappedClient.get("TEST");

    expect(result).toEqual("42");
    expect(mockTrackDependency).not.toHaveBeenCalled();
  });

  test("should NOT call `trackDependency` when the request failed", async () => {
    mockGet.mockRejectedValueOnce({});

    try {
      await wrappedClient.get("TEST");
    } catch (e) {}

    expect(mockTrackDependency).not.toHaveBeenCalled();
  });
});
