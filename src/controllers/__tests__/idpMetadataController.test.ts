import { Task } from "fp-ts/lib/Task";
import mockRes from "../../__mocks__/response";
import IdpMetadataController from "../idpMetadataController";

const mockIdpMetadataRefresher = jest.fn();

describe("IdpMetadataController#refresh", () => {
  it("should return success response", async () => {
    const res = mockRes();
    mockIdpMetadataRefresher.mockImplementation(
      () => new Task(() => Promise.resolve())
    );
    const idpMetadataController = new IdpMetadataController(
      mockIdpMetadataRefresher
    );
    const response = await idpMetadataController.refresh();
    response.apply(res);
    expect(idpMetadataController).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "IDPs Metadata Updated"
    });
  });
});
