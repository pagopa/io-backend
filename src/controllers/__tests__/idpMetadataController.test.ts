import { Task } from "fp-ts/lib/Task";
import mockRes from "../../__mocks__/response";
import IdpMetadataController from "../idpMetadataController";

const mockIdpMetadataRefresher = jest.fn();

describe("IdpMetadataController#refresh", () => {
  it("should return success response", async () => {
    const res = mockRes();
    mockIdpMetadataRefresher.mockImplementation(
      () => new Task(() => new Promise(resolve => setTimeout(resolve, 100)))
    );
    const idpMetadataController = new IdpMetadataController(
      mockIdpMetadataRefresher
    );
    const response = await idpMetadataController.refresh();
    response.apply(res);
    expect(idpMetadataController).toBeTruthy();
    expect(mockIdpMetadataRefresher).toBeCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Updating IDPs Metadata"
    });
  });
});
