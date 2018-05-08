import * as SwaggerParser from "swagger-parser";

describe("API specs", () => {
  const specFilePath = `${__dirname}/../../api.yaml`;

  it("should be valid", async () => {
    const api = await SwaggerParser.bundle(specFilePath);
    expect(api).toBeDefined();
  });
});
