// tslint:disable:no-any

/**
 * mockRes
 * @returns {{append, attachment, cookie, clearCookie, download, end, format, get, json, jsonp, links, location, redirect, render, send, sendFile, sendStatus, set, status, type, vary, reset: resetMock}}
 */

export default function mockRes(): any {
  const response = {
    append: jest.fn(),
    attachment: jest.fn(),
    clearCookie: jest.fn(),
    cookie: jest.fn(),
    download: jest.fn(),
    end: jest.fn(),
    format: jest.fn(),
    get: jest.fn(),
    json: jest.fn(),
    jsonp: jest.fn(),
    links: jest.fn(),
    location: jest.fn(),
    redirect: jest.fn(),
    render: jest.fn(),
    reset: resetMock,
    send: jest.fn(),
    sendFile: jest.fn(),
    sendStatus: jest.fn(),
    set: jest.fn(),
    status: jest.fn(),
    type: jest.fn(),
    vary: jest.fn()
  };

  response.append.mockImplementation(() => response);
  response.attachment.mockImplementation(() => response);
  response.cookie.mockImplementation(() => response);
  response.clearCookie.mockImplementation(() => response);
  response.download.mockImplementation(() => response);
  response.end.mockImplementation(() => response);
  response.format.mockImplementation(() => response);
  response.get.mockImplementation(() => response);
  response.json.mockImplementation(() => response);
  response.jsonp.mockImplementation(() => response);
  response.links.mockImplementation(() => response);
  response.location.mockImplementation(() => response);
  response.redirect.mockImplementation(() => response);
  response.render.mockImplementation(() => response);
  response.send.mockImplementation(() => response);
  response.sendFile.mockImplementation(() => response);
  response.sendStatus.mockImplementation(() => response);
  response.links.mockImplementation(() => response);
  response.set.mockImplementation(() => response);
  response.status.mockImplementation(() => response);
  response.type.mockImplementation(() => response);
  response.vary.mockImplementation(() => response);

  return response;
}

/**
 * resetMock
 */
function resetMock(this: any): any {
  this.append.mockClear();
  this.attachment.mockClear();
  this.cookie.mockClear();
  this.clearCookie.mockClear();
  this.download.mockClear();
  this.end.mockClear();
  this.format.mockClear();
  this.get.mockClear();
  this.json.mockClear();
  this.jsonp.mockClear();
  this.links.mockClear();
  this.location.mockClear();
  this.redirect.mockClear();
  this.render.mockClear();
  this.send.mockClear();
  this.sendFile.mockClear();
  this.sendStatus.mockClear();
  this.links.mockClear();
  this.set.mockClear();
  this.status.mockClear();
  this.type.mockClear();
  this.vary.mockClear();
}
