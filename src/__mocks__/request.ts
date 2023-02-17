/**
 * mockReq
 * @returns {{header, accepts, acceptsEncodings, acceptsEncoding, acceptsCharsets, acceptsCharset, acceptsLanguages, acceptsLanguage, range, param, is, reset: resetMock}}
 */

export default function mockReq({
  params = {},
  headers = {},
  body = {},
  query = {}
}: any = {}): any {
  const request = {
    accepts: jest.fn(),
    acceptsCharset: jest.fn(),
    acceptsCharsets: jest.fn(),
    acceptsEncoding: jest.fn(),
    acceptsEncodings: jest.fn(),
    acceptsLanguage: jest.fn(),
    acceptsLanguages: jest.fn(),
    body,
    header: jest.fn(),
    headers,
    is: jest.fn(),
    param: jest.fn(),
    params,
    query,
    range: jest.fn(),
    reset: resetMock
  };

  request.header.mockImplementation(() => request);
  request.accepts.mockImplementation(() => request);
  request.acceptsEncodings.mockImplementation(() => request);
  request.acceptsEncoding.mockImplementation(() => request);
  request.acceptsCharsets.mockImplementation(() => request);
  request.acceptsCharset.mockImplementation(() => request);
  request.acceptsLanguages.mockImplementation(() => request);
  request.acceptsLanguage.mockImplementation(() => request);
  request.range.mockImplementation(() => request);
  request.param.mockImplementation(name => {
    return { ...params, ...body, ...query }[name];
  });
  request.is.mockImplementation(() => request);

  return request;
}

/**
 * resetMock
 */
function resetMock(this: any): any {
  this.header.mockClear();
  this.accepts.mockClear();
  this.acceptsEncodings.mockClear();
  this.acceptsEncoding.mockClear();
  this.acceptsCharsets.mockClear();
  this.acceptsCharset.mockClear();
  this.acceptsLanguages.mockClear();
  this.acceptsLanguage.mockClear();
  this.range.mockClear();
  this.param.mockClear();
  this.is.mockClear();
}
