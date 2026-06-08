import * as SwaggerParser from "swagger-parser";

describe("API proxy specs", () => {
  const specFilePath = `${__dirname}/../../openapi/generated/api_backend.yaml`;

  it("should be valid", async () => {
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
});
