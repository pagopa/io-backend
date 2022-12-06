import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";
import { IoSignAPIClient } from "../../clients/io-sign";
import { mockedUser } from "../../__mocks__/user_mock";
import IoSignService from "../ioSignService";

const mockCreateFilledDocument = jest.fn();
const mockGetSignerByFiscalCode = jest.fn();
const mockGetInfo = jest.fn();
const mockGetQtspClausesMetadata = jest.fn();

const fakeDocumentUrl = "http://fakedomain.com/mock.pdf" as NonEmptyString;
const fakeEmail = "mock@fakedomain.com" as EmailString;
const fakeSignerId = "0000000000000" as NonEmptyString;

mockGetInfo.mockImplementation(() =>
  t.success({ status: 200, value: "It work" })
);

mockCreateFilledDocument.mockImplementation(() =>
  t.success({
    status: 201,
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

const api = {
  createFilledDocument: mockCreateFilledDocument,
  getSignerByFiscalCode: mockGetSignerByFiscalCode,
  getInfo: mockGetInfo,
  getQtspClausesMetadata: mockGetQtspClausesMetadata
} as ReturnType<IoSignAPIClient>;

describe("IoSignService#getSignerByFiscalCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoSignService(api);

    await service.getSignerByFiscalCode(mockedUser);

    expect(mockGetSignerByFiscalCode).toHaveBeenCalledWith({
      body: {
        fiscal_code: mockedUser.fiscal_code
      }
    });
  });

  it("should handle a success response", async () => {
    const service = new IoSignService(api);

    const res = await service.getSignerByFiscalCode(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the client returns 400", async () => {
    mockGetSignerByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 400 })
    );

    const service = new IoSignService(api);

    const res = await service.getSignerByFiscalCode(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorValidation"
    });
  });

  it("should handle a not found error when the user is not found", async () => {
    mockGetSignerByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 403 })
    );

    const service = new IoSignService(api);

    const res = await service.getSignerByFiscalCode(mockedUser);

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

    const res = await service.getSignerByFiscalCode(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetSignerByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new IoSignService(api);

    const res = await service.getSignerByFiscalCode(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetSignerByFiscalCode.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoSignService(api);

    const res = await service.getSignerByFiscalCode(mockedUser);

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

  it("should handle a success response", async () => {
    const service = new IoSignService(api);

    const res = await service.createFilledDocument(
      fakeDocumentUrl,
      fakeEmail,
      mockedUser.family_name as NonEmptyString,
      mockedUser.name as NonEmptyString,
      fakeSignerId
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
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
      kind: "IResponseErrorInternal"
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
