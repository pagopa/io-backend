import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";
import { DocumentToSign } from "../../../generated/io-sign-api/DocumentToSign";
import { Id } from "../../../generated/io-sign-api/Id";
import { QtspClauses } from "../../../generated/io-sign-api/QtspClauses";
import {
  SignatureDetailView,
  StatusEnum as SignatureStatusEnum
} from "../../../generated/io-sign-api/SignatureDetailView";
import { TypeEnum as ClauseTypeEnum } from "../../../generated/io-sign-api/Clause";
import { SignatureRequestDetailView } from "../../../generated/io-sign-api/SignatureRequestDetailView";
import { IoSignAPIClient } from "../../clients/io-sign";
import { aFiscalCode, mockedUser } from "../../__mocks__/user_mock";
import IoSignService from "../ioSignService";
import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import {
  aLollipopOriginalUrl,
  anAssertionRef,
  aSignatureInput
} from "../../__mocks__/lollipop";
import { AssertionTypeEnum } from "../../../generated/io-sign-api/AssertionType";
import { aSignature } from "../../__mocks__/lollipop";
import { LollipopMethodEnum } from "../../../generated/lollipop/LollipopMethod";
import { LollipopJWTAuthorization } from "../../../generated/io-sign-api/LollipopJWTAuthorization";
import { LollipopPublicKey } from "../../../generated/io-sign-api/LollipopPublicKey";
import { SignatureRequestStatusEnum } from "../../../generated/io-sign-api/SignatureRequestStatus";
import { IssuerEnvironmentEnum } from "../../../generated/io-sign-api/IssuerEnvironment";
import { SignatureRequestList } from "../../../generated/io-sign-api/SignatureRequestList";

const mockCreateFilledDocument = jest.fn();
const mockGetSignerByFiscalCode = jest.fn();
const mockGetInfo = jest.fn();
const mockGetQtspClausesMetadata = jest.fn();
const mockGetSignatureRequests = jest.fn();
const mockGetSignatureRequest = jest.fn();
const mockCreateSignature = jest.fn();
const mockFakeSuccess = jest.fn();

const fakeDocumentUrl = "http://fakedomain.com/mock.pdf" as NonEmptyString;
const fakeEmail = "mock@fakedomain.com" as EmailString;
const fakeSignerId = "0000000000000" as NonEmptyString;
const fakeIssuerEmail = "issuer@fakedomain.com" as EmailString;
const fakeIssuerDescription = "Fake description" as NonEmptyString;

const aBearerToken = "a bearer token" as LollipopJWTAuthorization;
const aPubKey = "a pub key" as LollipopPublicKey;

const lollipopRequestHeaders = {
  signature: aSignature,
  ["signature-input"]: aSignatureInput,
  ["x-pagopa-lollipop-original-method"]: LollipopMethodEnum.POST,
  ["x-pagopa-lollipop-original-url"]: aLollipopOriginalUrl,
  ["x-pagopa-lollipop-custom-sign-challenge"]: "customTosChallenge" as NonEmptyString,
  ["x-pagopa-lollipop-custom-tos-challenge"]: "customSignChallenge" as NonEmptyString,
  ["x-pagopa-lollipop-assertion-ref"]: anAssertionRef,
  ["x-pagopa-lollipop-assertion-type"]: AssertionTypeEnum.SAML,
  ["x-pagopa-lollipop-auth-jwt"]: aBearerToken,
  ["x-pagopa-lollipop-public-key"]: aPubKey,
  ["x-pagopa-lollipop-user-id"]: aFiscalCode
};

const fakeSignatureRequest: SignatureRequestDetailView = {
  id: "01GKVMRN408NXRT3R5HN3ADBJJ" as Id,
  status: SignatureRequestStatusEnum.WAIT_FOR_SIGNATURE,
  signer_id: fakeSignerId,
  issuer: {
    email: fakeIssuerEmail,
    description: fakeIssuerDescription,
    environment: IssuerEnvironmentEnum.TEST
  },
  dossier_id: "01ARZ3NDEKTSV4RRFFQ69G5FAV" as Id,
  dossier_title: "Dossier title mock" as NonEmptyString,
  documents: [
    {
      id: "01GKVMRN42JXW34AN6MRJ6843E" as Id,
      created_at: new Date(),
      updated_at: new Date(),
      url: fakeDocumentUrl,
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

const fakeSignatureRequestList: SignatureRequestList = {
  items: [
    {
      id: fakeSignatureRequest.id,
      signer_id: fakeSignatureRequest.signer_id,
      dossier_id: fakeSignatureRequest.dossier_id,
      dossier_title: fakeSignatureRequest.dossier_title,
      status: fakeSignatureRequest.status,
      created_at: fakeSignatureRequest.created_at,
      updated_at: fakeSignatureRequest.updated_at,
      expires_at: fakeSignatureRequest.expires_at
    }
  ]
};

const fakeSignature: SignatureDetailView = {
  id: "01GKVMRN408NXRT3R5HN3ADBJJ" as Id,
  signature_request_id: "01GKVMRN408NXRT3R5HN3ADBJJ" as Id,
  qtsp_signature_request_id: "01GKVMRN408NXRT3R5HN3ADBJJ" as Id,
  status: SignatureStatusEnum.CREATED
};

const fakeQtspAcceptedClauses: QtspClauses = {
  accepted_clauses: [{ text: "fake caluses...." as NonEmptyString }],
  filled_document_url: fakeDocumentUrl,
  nonce: "000000000==" as NonEmptyString
};

const fakeDocumentsToSign: ReadonlyArray<DocumentToSign> = [
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

mockGetInfo.mockImplementation(() =>
  t.success({ status: 200, value: "It work" })
);

mockCreateFilledDocument.mockImplementation(() =>
  t.success({
    status: 201,
    headers: { Location: "http://mockdocument.com/doc.pdf" },
    value: {
      filled_document_url: "http://mockdocument.com/doc.pdf"
    }
  })
);

mockGetSignerByFiscalCode.mockImplementation(() =>
  t.success({
    status: 200,
    value: {
      id: "000000000000"
    }
  })
);

mockGetQtspClausesMetadata.mockImplementation(() =>
  t.success({
    status: 200,
    value: {
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
    }
  })
);

mockGetSignatureRequests.mockImplementation(() =>
  t.success({
    status: 200,
    value: fakeSignatureRequestList
  })
);

mockGetSignatureRequest.mockImplementation(() =>
  t.success({
    status: 200,
    value: fakeSignatureRequest
  })
);

mockCreateSignature.mockImplementation(() =>
  t.success({
    status: 200,
    value: fakeSignature
  })
);

mockFakeSuccess.mockImplementation(() =>
  t.success({
    status: 200
  })
);

const api = {
  createFilledDocument: mockCreateFilledDocument,
  getSignerByFiscalCode: mockGetSignerByFiscalCode,
  getInfo: mockGetInfo,
  getQtspClausesMetadata: mockGetQtspClausesMetadata,
  getSignatureRequests: mockGetSignatureRequests,
  getSignatureRequestById: mockGetSignatureRequest,
  createSignature: mockCreateSignature,
  getThirdPartyMessageDetails: mockFakeSuccess,
  getThirdPartyMessageAttachmentContent: mockFakeSuccess
} as ReturnType<IoSignAPIClient>;

describe("IoSignService#getSignerByFiscalCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoSignService(api);

    await service.getSignerByFiscalCode(mockedUser.fiscal_code);

    expect(mockGetSignerByFiscalCode).toHaveBeenCalledWith({
      body: {
        fiscal_code: mockedUser.fiscal_code
      }
    });
  });

  it("should handle a success response", async () => {
    const service = new IoSignService(api);

    const res = await service.getSignerByFiscalCode(mockedUser.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the client returns 400", async () => {
    mockGetSignerByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 400 })
    );

    const service = new IoSignService(api);

    const res = await service.getSignerByFiscalCode(mockedUser.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorValidation"
    });
  });

  it("should handle a not found error when the user is not found", async () => {
    mockGetSignerByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 403 })
    );

    const service = new IoSignService(api);

    const res = await service.getSignerByFiscalCode(mockedUser.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetSignerByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoSignService(api);

    const res = await service.getSignerByFiscalCode(mockedUser.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetSignerByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new IoSignService(api);

    const res = await service.getSignerByFiscalCode(mockedUser.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: "Internal server error: unhandled API response status [123]"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetSignerByFiscalCode.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoSignService(api);

    const res = await service.getSignerByFiscalCode(mockedUser.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoSignService#createFilledDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoSignService(api);

    await service.createFilledDocument(
      fakeDocumentUrl,
      fakeEmail,
      mockedUser.family_name as NonEmptyString,
      mockedUser.name as NonEmptyString,
      fakeSignerId
    );

    expect(mockCreateFilledDocument).toHaveBeenCalledWith({
      body: {
        document_url: fakeDocumentUrl,
        email: fakeEmail,
        family_name: mockedUser.family_name,
        name: mockedUser.name
      },
      "x-iosign-signer-id": fakeSignerId
    });
  });

  it("should handle a success redirect to resource response", async () => {
    const service = new IoSignService(api);

    const res = await service.createFilledDocument(
      fakeDocumentUrl,
      fakeEmail,
      mockedUser.family_name as NonEmptyString,
      mockedUser.name as NonEmptyString,
      fakeSignerId
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessRedirectToResource"
    });
  });

  it("should handle an internal error when the client returns 400", async () => {
    mockCreateFilledDocument.mockImplementationOnce(() =>
      t.success({ status: 400 })
    );

    const service = new IoSignService(api);

    const res = await service.createFilledDocument(
      fakeDocumentUrl,
      fakeEmail,
      mockedUser.family_name as NonEmptyString,
      mockedUser.name as NonEmptyString,
      fakeSignerId
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorValidation"
    });
  });

  it("should handle a not found error when the user is not found", async () => {
    mockCreateFilledDocument.mockImplementationOnce(() =>
      t.success({ status: 404 })
    );

    const service = new IoSignService(api);

    const res = await service.createFilledDocument(
      fakeDocumentUrl,
      fakeEmail,
      mockedUser.family_name as NonEmptyString,
      mockedUser.name as NonEmptyString,
      fakeSignerId
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockCreateFilledDocument.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoSignService(api);

    const res = await service.createFilledDocument(
      fakeDocumentUrl,
      fakeEmail,
      mockedUser.family_name as NonEmptyString,
      mockedUser.name as NonEmptyString,
      fakeSignerId
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockCreateFilledDocument.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new IoSignService(api);

    const res = await service.createFilledDocument(
      fakeDocumentUrl,
      fakeEmail,
      mockedUser.family_name as NonEmptyString,
      mockedUser.name as NonEmptyString,
      fakeSignerId
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: "Internal server error: unhandled API response status [123]"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockCreateFilledDocument.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoSignService(api);

    const res = await service.createFilledDocument(
      fakeDocumentUrl,
      fakeEmail,
      mockedUser.family_name as NonEmptyString,
      mockedUser.name as NonEmptyString,
      fakeSignerId
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoSignService#getQtspClausesMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call with TEST issuer env and handle a success response", async () => {
    const service = new IoSignService(api);

    const res = await service.getQtspClausesMetadata(
      IssuerEnvironmentEnum.TEST
    );

    expect(mockGetQtspClausesMetadata).toHaveBeenCalledWith({
      "x-iosign-issuer-environment": "TEST"
    });

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should make the correct api call with DEFAULT issuer env and handle a success response", async () => {
    const service = new IoSignService(api);

    const res = await service.getQtspClausesMetadata(
      IssuerEnvironmentEnum.DEFAULT
    );

    expect(mockGetQtspClausesMetadata).toHaveBeenCalledWith({
      "x-iosign-issuer-environment": "DEFAULT"
    });

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetQtspClausesMetadata.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );
    const service = new IoSignService(api);
    const res = await service.getQtspClausesMetadata(
      IssuerEnvironmentEnum.TEST
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetQtspClausesMetadata.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new IoSignService(api);
    const res = await service.getQtspClausesMetadata(
      IssuerEnvironmentEnum.TEST
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetQtspClausesMetadata.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoSignService(api);
    const res = await service.getQtspClausesMetadata(
      IssuerEnvironmentEnum.TEST
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoSignService#getSignatureRequests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoSignService(api);

    await service.getSignatureRequests(fakeSignatureRequest.signer_id);

    expect(mockGetSignatureRequests).toHaveBeenCalledWith({
      "x-iosign-signer-id": fakeSignatureRequest.signer_id
    });
  });

  it("should handle a success response", async () => {
    const service = new IoSignService(api);

    const res = await service.getSignatureRequests(
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle a not found error (403) when the user is not found", async () => {
    mockGetSignatureRequests.mockImplementationOnce(() =>
      t.success({ status: 403 })
    );

    const service = new IoSignService(api);

    const res = await service.getSignatureRequests(
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};

    mockGetSignatureRequests.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoSignService(api);

    const res = await service.getSignatureRequests(
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetSignatureRequests.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new IoSignService(api);

    const res = await service.getSignatureRequests(
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: "Internal server error: unhandled API response status [123]"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetSignatureRequests.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoSignService(api);

    const res = await service.getSignatureRequests(
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoSignService#getSignatureRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoSignService(api);

    await service.getSignatureRequest(
      fakeSignatureRequest.id,
      fakeSignatureRequest.signer_id
    );

    expect(mockGetSignatureRequest).toHaveBeenCalledWith({
      id: fakeSignatureRequest.id,
      "x-iosign-signer-id": fakeSignatureRequest.signer_id
    });
  });

  it("should handle a success response", async () => {
    const service = new IoSignService(api);

    const res = await service.getSignatureRequest(
      fakeSignatureRequest.id,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle a not found error when the client returns 404 when the signature request is not found", async () => {
    mockGetSignatureRequest.mockImplementationOnce(() =>
      t.success({ status: 404 })
    );

    const service = new IoSignService(api);

    const res = await service.getSignatureRequest(
      fakeSignatureRequest.id,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle a not found error (403) when the user is not found", async () => {
    mockGetSignatureRequest.mockImplementationOnce(() =>
      t.success({ status: 403 })
    );

    const service = new IoSignService(api);

    const res = await service.getSignatureRequest(
      fakeSignatureRequest.id,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};

    mockGetSignatureRequest.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoSignService(api);

    const res = await service.getSignatureRequest(
      fakeSignatureRequest.id,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetSignatureRequest.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new IoSignService(api);

    const res = await service.getSignatureRequest(
      fakeSignatureRequest.id,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: "Internal server error: unhandled API response status [123]"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetSignatureRequest.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoSignService(api);

    const res = await service.getSignatureRequest(
      fakeSignatureRequest.id,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoSignService#createSignature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createSignatureBody = {
    signature_request_id: fakeSignature.id,
    documents_to_sign: fakeDocumentsToSign,
    qtsp_clauses: fakeQtspAcceptedClauses,
    email: fakeEmail
  };

  it("should make the correct api call", async () => {
    const service = new IoSignService(api);

    await service.createSignature(
      lollipopRequestHeaders,
      createSignatureBody,
      fakeSignatureRequest.signer_id
    );

    expect(mockCreateSignature).toHaveBeenCalledWith({
      body: {
        signature_request_id: fakeSignature.signature_request_id,
        email: fakeEmail,
        documents_to_sign: fakeDocumentsToSign,
        qtsp_clauses: fakeQtspAcceptedClauses
      },
      "x-iosign-signer-id": fakeSignerId,
      ...lollipopRequestHeaders
    });
  });

  it("should handle a success response", async () => {
    const service = new IoSignService(api);

    const res = await service.createSignature(
      lollipopRequestHeaders,
      createSignatureBody,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle a validation error when the client returns 400", async () => {
    mockCreateSignature.mockImplementationOnce(() =>
      t.success({ status: 400 })
    );

    const service = new IoSignService(api);

    const res = await service.createSignature(
      lollipopRequestHeaders,
      createSignatureBody,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorValidation"
    });
  });

  it("should handle a not found error when the client returns 404 when the signature request is not found", async () => {
    mockCreateSignature.mockImplementationOnce(() =>
      t.success({ status: 404 })
    );

    const service = new IoSignService(api);

    const res = await service.createSignature(
      lollipopRequestHeaders,
      createSignatureBody,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle a not found error (403) when the user is not found", async () => {
    mockCreateSignature.mockImplementationOnce(() =>
      t.success({ status: 403 })
    );

    const service = new IoSignService(api);

    const res = await service.createSignature(
      lollipopRequestHeaders,
      createSignatureBody,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};

    mockCreateSignature.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoSignService(api);

    const res = await service.createSignature(
      lollipopRequestHeaders,
      createSignatureBody,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockCreateSignature.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new IoSignService(api);

    const res = await service.createSignature(
      lollipopRequestHeaders,
      createSignatureBody,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: "Internal server error: unhandled API response status [123]"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockCreateSignature.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoSignService(api);

    const res = await service.createSignature(
      lollipopRequestHeaders,
      createSignatureBody,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});
