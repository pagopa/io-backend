import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { PecServersConfig, PecServerConfig } from "../../config";
import PecServerClientFactory from "../pecServerClientFactory";
import * as P from "../../clients/pecserver";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

const validPecConfigs = {
  poste: {
    url: "https://poste.dummy/",
    basePath: "",
    secret: "dummy-secret",
    serviceId: "1"
  },
  aruba: {
    url: "https://aruba.dummy/",
    basePath: "",
    secret: "dummy-secret",
    serviceId: "2"
  }
} as PecServersConfig;
const dummyBearerGenerator = (
  _config: PecServerConfig
): TE.TaskEither<Error, string> => TE.fromEither(E.right("dummy-token"));

describe("getClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN a pecservers configuration WHEN the client is requested with poste id THEN the client returned is configured with poste info", async () => {
    const mockPecServerClient = jest.spyOn(P, "pecServerClient");
    await new PecServerClientFactory(validPecConfigs)
      .getClient(dummyBearerGenerator, "1" as NonEmptyString)
      .run();
    expect(mockPecServerClient).toHaveBeenCalledTimes(1);
    expect(mockPecServerClient).toHaveBeenCalledWith(
      "https://poste.dummy/",
      "",
      expect.any(Function)
    );
  });

  it("GIVEN a pecservers configuration WHEN the client is requested with aruba id THEN the client returned is configured with aruba info", async () => {
    const mockPecServerClient = jest.spyOn(P, "pecServerClient");
    await new PecServerClientFactory(validPecConfigs)
      .getClient(dummyBearerGenerator, "2" as NonEmptyString)
      .run();
    expect(mockPecServerClient).toHaveBeenCalledTimes(1);
    expect(mockPecServerClient).toHaveBeenCalledWith(
      "https://aruba.dummy/",
      "",
      expect.any(Function)
    );
  });

  it("GIVEN a pecservers configuration WHEN the client is requested with not existing id THEN the client returned is configured with poste info", async () => {
    const mockPecServerClient = jest.spyOn(P, "pecServerClient");
    await new PecServerClientFactory(validPecConfigs)
      .getClient(dummyBearerGenerator, "3" as NonEmptyString)
      .run();
    expect(mockPecServerClient).toHaveBeenCalledTimes(1);
    expect(mockPecServerClient).toHaveBeenCalledWith(
      "https://poste.dummy/",
      "",
      expect.any(Function)
    );
  });

  it("GIVEN a pecservers configuration WHEN the client is requested with an undefined id THEN the client returned is configured with poste info", async () => {
    const mockPecServerClient = jest.spyOn(P, "pecServerClient");
    await new PecServerClientFactory(validPecConfigs)
      .getClient(dummyBearerGenerator, undefined)
      .run();
    expect(mockPecServerClient).toHaveBeenCalledTimes(1);
    expect(mockPecServerClient).toHaveBeenCalledWith(
      "https://poste.dummy/",
      "",
      expect.any(Function)
    );
  });
});
