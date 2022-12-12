import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";
import { Id } from "../../../generated/io-sign-api/Id";
import {
  SignatureRequestDetailView,
  StatusEnum
} from "../../../generated/io-sign-api/SignatureRequestDetailView";
import { IoSignAPIClient } from "../../clients/io-sign";
import { mockedUser } from "../../__mocks__/user_mock";
import IoSignService from "../ioSignService";

const mockCreateFilledDocument = jest.fn();
const mockGetSignerByFiscalCode = jest.fn();
const mockGetInfo = jest.fn();
const mockGetQtspClausesMetadata = jest.fn();
const mockGetSignatureRequest = jest.fn();

const fakeDocumentUrl = "http://fakedomain.com/mock.pdf" as NonEmptyString;
const fakeEmail = "mock@fakedomain.com" as EmailString;
const fakeSignerId = "0000000000000" as NonEmptyString;

const fakeSignatureRequest: SignatureRequestDetailView = {
  id: "01GKVMRN408NXRT3R5HN3ADBJJ" as Id,
  status: StatusEnum.WAIT_FOR_SIGNATURE,
  signer_id: fakeSignerId,
  dossier_id: "01ARZ3NDEKTSV4RRFFQ69G5FAV" as Id,
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

mockGetSignatureRequest.mockImplementation(() =>
  t.success({
    status: 200,
    value: fakeSignatureRequest
  })
);

const api = {
  createFilledDocument: mockCreateFilledDocument,
  getSignerByFiscalCode: mockGetSignerByFiscalCode,
  getInfo: mockGetInfo,
  getQtspClausesMetadata: mockGetQtspClausesMetadata,
  getSignatureRequestById: mockGetSignatureRequest
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
      params: {
        id: fakeSignatureRequest.id
      },
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

  it("should handle an internal error when the client returns 400", async () => {
    mockGetSignatureRequest.mockImplementationOnce(() =>
      t.success({ status: 400 })
    );

    const service = new IoSignService(api);

    const res = await service.getSignatureRequest(
      fakeSignatureRequest.id,
      fakeSignatureRequest.signer_id
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorValidation"
    });
  });

  it("should handle a not found error when the signature request is not found", async () => {
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

  it("should make the correct api call and handle a success response", async () => {
    const service = new IoSignService(api);

    const res = await service.getQtspClausesMetadata();

    expect(mockGetQtspClausesMetadata).toHaveBeenCalledWith({});

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
    const res = await service.getQtspClausesMetadata();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetQtspClausesMetadata.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new IoSignService(api);
    const res = await service.getQtspClausesMetadata();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetQtspClausesMetadata.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoSignService(api);
    const res = await service.getQtspClausesMetadata();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});
