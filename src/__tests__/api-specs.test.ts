import * as SwaggerParser from "swagger-parser";

describe("API proxy specs", () => {
  const specFilePath = `${__dirname}/../../openapi/generated/api_auth.yaml`;

  it("should be valid", async () => {
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
});

describe("API notifications specs", () => {
  const specFilePath = `${__dirname}/../../openapi/generated/api_notifications.yaml`;

  it("should be valid", async () => {
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
});

describe("API EUCovidCert specs", () => {
  const specFilePath = `${__dirname}/../../openapi/generated/api_eucovidcert.yaml`;

  it("should be valid", async () => {
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
});
