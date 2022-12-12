import {
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import IoSignController from "../ioSignController";
import { IoSignAPIClient } from "../../clients/io-sign";
import ApiClient from "../../services/apiClientFactory";
import IoSignService from "../../services/ioSignService";
import ProfileService from "../../services/profileService";
import { FilledDocumentDetailView } from "../../../generated/io-sign-api/FilledDocumentDetailView";

import {
  mockedInitializedProfile,
  mockedUser
} from "../../__mocks__/user_mock";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import { NonEmptyString } from "io-ts-types";
import {
  SignatureRequestDetailView,
  StatusEnum
} from "../../../generated/io-sign-api/SignatureRequestDetailView";

import { Id } from "../../../generated/io-sign-api/Id";

const API_KEY = "";
const API_URL = "";
const API_BASE_PATH = "";

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

const mockCreateFilledDocument = jest.fn();
const mockGetSignerByFiscalCode = jest.fn();
const mockGetQtspClausesMetadata = jest.fn();
const mockGetSignatureRequest = jest.fn();

jest.mock("../../services/ioSignService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      createFilledDocument: mockCreateFilledDocument,
      getSignerByFiscalCode: mockGetSignerByFiscalCode,
      getQtspClausesMetadata: mockGetQtspClausesMetadata,
      getSignatureRequest: mockGetSignatureRequest
    }))
  };
});

const mockGetProfile = jest.fn();

jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getProfile: mockGetProfile
    }))
  };
});

const qtspClausesMetadata = {
  clauses: [
    {
      text: "(1) Io sottoscritto/a dichiaro quanto...."
    },
    {
      text: "(2) Io sottoscritto/a accetto..."
    }
  ],
  document_url: "https://mock.com/modulo.pdf",
  privacy_url: "https://mock.com/privacy.pdf",
  terms_and_conditions_url: "https://mock.com/tos.pdf",
  privacy_text: "[PLACE HOLDER]",
  nonce: "acSPlAeZY9TM0gdzJcl9+Cp3NxlUTPyk/+B9CqHsufWQmib+QHpe=="
};

const signatureRequest: SignatureRequestDetailView = {
  id: "01GKVMRN408NXRT3R5HN3ADBJJ" as Id,
  status: StatusEnum.WAIT_FOR_SIGNATURE,
  signer_id: "37862aff-3436-4487-862b-fd9e7d2a114e" as Id,
  dossier_id: "01ARZ3NDEKTSV4RRFFQ69G5FAV" as Id,
  documents: [
    {
      id: "01GKVMRN42JXW34AN6MRJ6843E" as Id,
      created_at: new Date(),
      updated_at: new Date(),
      url: "https://my-document.url/document.pdf",
      metadata: {
        title: "My document title",
        signature_fields: []
      }
    }
  ],
  created_at: new Date(),
  updated_at: new Date(),
  expires_at: new Date()
};

const client = IoSignAPIClient(API_KEY, API_URL, API_BASE_PATH);
const apiClient = new ApiClient("XUZTCT88A51Y311X", "");

const ioSignService = new IoSignService(client);
const profileService = new ProfileService(apiClient);

const documentToFill = "http://mockdocument.com/upload.pdf";

const filledDocumentMock: FilledDocumentDetailView = {
  filled_document_url: "http://mockdocument.com/doc.pdf"
};

const signerDetailMock = { id: "0000000" };

describe("IoSignController#createFilledDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    mockGetSignerByFiscalCode.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(signerDetailMock))
    );
    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockedInitializedProfile))
    );

    const req = {
      ...mockReq({
        body: { document_url: documentToFill }
      }),
      user: mockedUser
    };

    const controller = new IoSignController(ioSignService, profileService);
    await controller.createFilledDocument(req);

    expect(mockCreateFilledDocument).toHaveBeenCalledWith(
      documentToFill,
      mockedInitializedProfile.email as EmailString,
      mockedInitializedProfile.family_name as NonEmptyString,
      mockedInitializedProfile.name as NonEmptyString,
      signerDetailMock.id
    );
  });

  it("should call createFilledDocument method on the IoSignService with valid values", async () => {
    const req = {
      ...mockReq({
        body: { document_url: "http://mockdocument.com/upload.pdf" }
      }),
      user: mockedUser
    };

    mockCreateFilledDocument.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(filledDocumentMock))
    );

    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockedInitializedProfile))
    );

    const controller = new IoSignController(ioSignService, profileService);

    const response = await controller.createFilledDocument(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: filledDocumentMock
    });
  });

  it("should not call createFilledDocument method on the IoSignService with empty document_url", async () => {
    const req = {
      ...mockReq(),
      user: mockedUser
    };

    const res = mockRes();

    const controller = new IoSignController(ioSignService, profileService);
    const response = await controller.createFilledDocument(req);

    response.apply(res);

    // service method is not called
    expect(mockCreateFilledDocument).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should return an error if the signer is not found", async () => {
    mockGetSignerByFiscalCode.mockReturnValue(
      Promise.reject(ResponseErrorInternal("Signer not found"))
    );
    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockedInitializedProfile))
    );

    const req = {
      ...mockReq({
        body: { document_url: documentToFill }
      }),
      user: mockedUser
    };

    const controller = new IoSignController(ioSignService, profileService);
    const response = await controller.createFilledDocument(req);

    expect(response).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorInternal"
      })
    );
  });

  it("should return an error if the profile is not found", async () => {
    mockGetSignerByFiscalCode.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(signerDetailMock))
    );
    mockGetProfile.mockReturnValue(
      Promise.reject(ResponseErrorInternal("Profile not found"))
    );

    const req = {
      ...mockReq({
        body: { document_url: documentToFill }
      }),
      user: mockedUser
    };

    const controller = new IoSignController(ioSignService, profileService);
    const response = await controller.createFilledDocument(req);

    expect(response).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorInternal"
      })
    );
  });
});

describe("IoSignController#getQtspClausesMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const controller = new IoSignController(ioSignService, profileService);
    await controller.getQtspClausesMetadata();

    expect(mockGetQtspClausesMetadata).toHaveBeenCalledWith();
  });

  it("should call getQtspClausesMetadata method on the IoSignService with valid values", async () => {
    mockGetQtspClausesMetadata.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(qtspClausesMetadata))
    );
    const controller = new IoSignController(ioSignService, profileService);
    const response = await controller.getQtspClausesMetadata();

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: qtspClausesMetadata
    });
  });

  describe("IoSignController#getSignatureRequest", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should make the correct service method call", async () => {
      const controller = new IoSignController(ioSignService, profileService);
      const req = {
        ...mockReq({
          params: {
            id: signatureRequest.id
          }
        }),
        user: mockedUser
      };
      await controller.getSignatureRequest(req);
      expect(mockGetSignatureRequest).toHaveBeenCalledWith();
    });

    it("should call getSignatureRequest method on the IoSignService with valid values", async () => {
      mockGetSignatureRequest.mockReturnValue(
        Promise.resolve(ResponseSuccessJson(signatureRequest))
      );
      const controller = new IoSignController(ioSignService, profileService);
      const req = {
        ...mockReq({
          params: {
            id: signatureRequest.id
          }
        }),
        user: mockedUser
      };
      const response = await controller.getSignatureRequest(req);

      expect(response).toEqual({
        apply: expect.any(Function),
        kind: "IResponseSuccessJson",
        value: signatureRequest
      });
    });
  });
});
