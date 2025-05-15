import * as SwaggerParser from "swagger-parser";

describe("API public proxy specs", () => {
  it("should be valid specs for auth domain", async () => {
    const specFilePath = `${__dirname}/../../openapi/generated/api_auth.yaml`;
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
  it("should be valid API cgn domain specs", async () => {
    const specFilePath = `${__dirname}/../../openapi/generated/api_cgn.yaml`;
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
  it("should be valid API communication domain specs", async () => {
    const specFilePath = `${__dirname}/../../openapi/generated/api_communication.yaml`;
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
  it("should be valid API FIMS specs", async () => {
    const specFilePath = `${__dirname}/../../openapi/generated/api_io_fims.yaml`;
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
  it("should be valid API io-sign specs", async () => {
    const specFilePath = `${__dirname}/../../openapi/generated/api_io_sign.yaml`;
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
  it("should be valid API io-wallet domain specs", async () => {
    const specFilePath = `${__dirname}/../../openapi/generated/api_io_wallet.yaml`;
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
  it("should be valid API payments domain specs", async () => {
    const specFilePath = `${__dirname}/../../openapi/generated/api_payments.yaml`;
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
  it("should be valid API platform domain specs", async () => {
    const specFilePath = `${__dirname}/../../openapi/generated/api_platform_legacy.yaml`;
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
  it("should be valid API services domain specs", async () => {
    const specFilePath = `${__dirname}/../../openapi/generated/api_services.yaml`;
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
  it("should be valid API EUCovidCert specs", async () => {
    const specFilePath = `${__dirname}/../../openapi/generated/api_eucovidcert.yaml`;
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
});

describe("API internal ", () => {
  it("should be valid auth domain for sessions specs", async () => {
    const specFilePath = `${__dirname}/../../openapi/generated/api_session.yaml`;
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
  it("should be valid API notifications specs", async () => {
    const specFilePath = `${__dirname}/../../openapi/generated/api_notifications.yaml`;
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
});
