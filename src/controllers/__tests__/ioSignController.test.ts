import {
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import IoSignController, {
  IoSignLollipopLocalsType
} from "../ioSignController";
import { IoSignAPIClient } from "../../clients/io-sign";
import ApiClient from "../../services/apiClientFactory";
import IoSignService from "../../services/ioSignService";
import ProfileService from "../../services/profileService";
import { FilledDocumentDetailView } from "../../../generated/io-sign-api/FilledDocumentDetailView";

import {
  aFiscalCode,
  mockedInitializedProfile,
  mockedUser
} from "../../__mocks__/user_mock";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import {
  SignatureRequestDetailView,
  StatusEnum as SignatureRequestStatusEnum
} from "../../../generated/io-sign/SignatureRequestDetailView";
import { Id } from "../../../generated/io-sign/Id";
import { QtspClauses } from "../../../generated/io-sign/QtspClauses";
import { DocumentToSign } from "../../../generated/io-sign/DocumentToSign";
import { TypeEnum as ClauseTypeEnum } from "../../../generated/io-sign-api/Clause";
import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import {
  SignatureDetailView,
  StatusEnum as SignatureStatusEnum
} from "../../../generated/io-sign/SignatureDetailView";
import { LollipopMethodEnum } from "../../../generated/lollipop/LollipopMethod";
import { LollipopSignature } from "../../../generated/lollipop/LollipopSignature";
import { LollipopOriginalURL } from "../../../generated/lollipop/LollipopOriginalURL";
import { LollipopSignatureInput } from "../../../generated/lollipop/LollipopSignatureInput";
import { LollipopJWTAuthorization } from "../../../generated/io-sign-api/LollipopJWTAuthorization";
import { LollipopPublicKey } from "../../../generated/io-sign-api/LollipopPublicKey";
import { anAssertionRef } from "../../__mocks__/lollipop";
import { AssertionTypeEnum } from "../../../generated/io-sign-api/AssertionType";
import { CreateSignatureBody } from "../../../generated/io-sign/CreateSignatureBody";

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
const mockCreateSignature = jest.fn();

const aBearerToken = "a bearer token" as LollipopJWTAuthorization;
const aPubKey = "a pub key" as LollipopPublicKey;

const lollipopRequestHeaders = {
  signature: "sig1=:hNojB+wWw4A7SYF3qK1S01Y4UP5i2JZFYa2WOlMB4Np5iWmJSO0bDe2hrYRbcIWqVAFjuuCBRsB7lYQJkzbb6g==:" as LollipopSignature,
  ["signature-input"]: `sig1=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url"); created=1618884475; keyid="test-key-rsa-pss"` as LollipopSignatureInput,
  ["x-pagopa-lollipop-original-method"]: LollipopMethodEnum.POST,
  ["x-pagopa-lollipop-original-url"]: "https://api.pagopa.it" as LollipopOriginalURL,
  ["x-pagopa-lollipop-custom-sign-challenge"]: "customTosChallenge" as NonEmptyString,
  ["x-pagopa-lollipop-custom-tos-challenge"]: "customSignChallenge" as NonEmptyString
};

const ioSignLollipopLocals: IoSignLollipopLocalsType = {
  ...lollipopRequestHeaders,
  ["x-pagopa-lollipop-assertion-ref"]: anAssertionRef,
  ["x-pagopa-lollipop-assertion-type"]: AssertionTypeEnum.SAML,
  ["x-pagopa-lollipop-auth-jwt"]: aBearerToken,
  ["x-pagopa-lollipop-public-key"]: aPubKey,
  ["x-pagopa-lollipop-user-id"]: aFiscalCode
};

jest.mock("../../services/ioSignService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      createFilledDocument: mockCreateFilledDocument,
      getSignerByFiscalCode: mockGetSignerByFiscalCode,
      getQtspClausesMetadata: mockGetQtspClausesMetadata,
      getSignatureRequest: mockGetSignatureRequest,
      createSignature: mockCreateSignature
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
  status: SignatureRequestStatusEnum.WAIT_FOR_SIGNATURE,
  signer_id: "37862aff-3436-4487-862b-fd9e7d2a114e" as Id,
  issuer: {
    email: "issuer@fakedomain.com" as EmailString,
    description: "Fake description" as NonEmptyString
  },
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

const signature: SignatureDetailView = {
  id: "01GKVMRN408NXRT3R5HN3ADBJJ" as Id,
  signature_request_id: "01GKVMRN408NXRT3R5HN3ADBJJ" as Id,
  qtsp_signature_request_id: "01GKVMRN408NXRT3R5HN3ADBJJ" as Id,
  status: SignatureStatusEnum.CREATED
};

const qtspAcceptedClauses: QtspClauses = {
  accepted_clauses: [{ text: "fake caluses...." as NonEmptyString }],
  filled_document_url: "https://my-document.url/document.pdf" as NonEmptyString,
  nonce: "000000000==" as NonEmptyString
};

const documentsToSign: ReadonlyArray<DocumentToSign> = [
  {
    document_id: "01GKVMRN408NXRT3R5HN3ADBJJ" as NonEmptyString,
    signature_fields: [
      {
        clause: {
          title: "Firma document",
          type: ClauseTypeEnum.REQUIRED
        },
        attrs: {
          unique_name: "field1" as NonEmptyString
        }
      },
      {
        clause: {
          title: "Firma document",
          type: ClauseTypeEnum.REQUIRED
        },
        attrs: {
          bottom_left: { x: 10, y: 10 },
          top_right: { x: 100, y: 20 },
          page: 1 as NonNegativeNumber
        }
      }
    ]
  }
];

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
        kind: "IResponseErrorInternal",
        detail:
          "Internal server error: Error retrieving the signer id for this user"
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
        kind: "IResponseErrorInternal",
        detail:
          "Internal server error: Error retrieving a user profile with validated email address | Error retrieving user profile"
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
    expect(mockGetSignatureRequest).toHaveBeenCalledWith(
      signatureRequest.id,
      signerDetailMock.id
    );
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

describe("IoSignController#createSignature", () => {
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
    const body = {
      signature_request_id: signature.signature_request_id,
      documents_to_sign: documentsToSign,
      qtsp_clauses: qtspAcceptedClauses
    };
    const req = {
      ...mockReq({
        body
      }),
      headers: lollipopRequestHeaders,
      user: mockedUser
    };

    const controller = new IoSignController(ioSignService, profileService);
    await controller.createSignature(req, ioSignLollipopLocals);

    expect(mockCreateSignature).toHaveBeenCalledWith(
      ioSignLollipopLocals,
      {
        ...body,
        email: mockedInitializedProfile.email
      },
      signerDetailMock.id
    );
  });

  it("should call createSignature method on the IoSignService with valid values", async () => {
    const body: CreateSignatureBody = {
      signature_request_id: signature.signature_request_id,
      documents_to_sign: documentsToSign,
      qtsp_clauses: qtspAcceptedClauses
    };

    const req = {
      ...mockReq({
        body
      }),
      headers: lollipopRequestHeaders,
      user: mockedUser
    };

    mockCreateSignature.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(filledDocumentMock))
    );

    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockedInitializedProfile))
    );

    const controller = new IoSignController(ioSignService, profileService);

    const response = await controller.createSignature(
      req,
      ioSignLollipopLocals
    );

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: filledDocumentMock
    });
  });

  it("should not call createSignature method on the IoSignService with empty body", async () => {
    const req = {
      ...mockReq(),
      user: mockedUser,
      headers: lollipopRequestHeaders
    };

    const res = mockRes();

    const controller = new IoSignController(ioSignService, profileService);
    const response = await controller.createSignature(
      req,
      ioSignLollipopLocals
    );

    response.apply(res);

    // service method is not called
    expect(mockCreateSignature).not.toBeCalled();
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
        body: {
          signature_request_id: signature.signature_request_id,
          documents_to_sign: documentsToSign,
          qtsp_clauses: qtspAcceptedClauses
        }
      }),
      headers: lollipopRequestHeaders,
      user: mockedUser
    };

    const controller = new IoSignController(ioSignService, profileService);
    const response = await controller.createSignature(
      req,
      ioSignLollipopLocals
    );

    expect(response).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorInternal",
        detail:
          "Internal server error: Error retrieving the signer id for this user"
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
        body: {
          signature_request_id: signature.signature_request_id,
          documents_to_sign: documentsToSign,
          qtsp_clauses: qtspAcceptedClauses
        }
      }),
      headers: lollipopRequestHeaders,
      user: mockedUser
    };

    const controller = new IoSignController(ioSignService, profileService);
    const response = await controller.createSignature(
      req,
      ioSignLollipopLocals
    );

    expect(response).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorInternal",
        detail:
          "Internal server error: Error retrieving a user profile with validated email address | Error retrieving user profile"
      })
    );
  });
});
