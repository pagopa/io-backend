import * as apicache from "apicache";
import { Express, NextFunction, Request, Response } from "express";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import {
  CIDR,
  NonEmptyString,
  OrganizationFiscalCode
} from "italia-ts-commons/lib/strings";
import * as passport from "passport";
import * as request from "supertest";

import { DepartmentName } from "../../generated/backend/DepartmentName";
import { OrganizationName } from "../../generated/backend/OrganizationName";
import { ServiceName } from "../../generated/backend/ServiceName";
import { ServicePublic } from "../../generated/backend/ServicePublic";

// Bypass user autentication
jest.spyOn(passport, "authenticate").mockImplementation((_, __) => {
  return (___: Request, ____: Response, next: NextFunction) => {
    next();
  };
});
const expectedCacheDurationSeconds = 1;
// tslint:disable-next-line: no-object-mutation
process.env.CACHE_MAX_AGE_SECONDS = String(expectedCacheDurationSeconds);

jest.mock("../services/apiClientFactory");
jest.mock("../services/redisSessionStorage");
jest.mock("../services/redisUserMetadataStorage");

const mockGetService = jest.fn();
jest.mock("../services/messagesService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getService: mockGetService
    }))
  };
});
jest.mock("../utils/redis");

import appModule from "../app";

const aValidCIDR = "192.168.0.0/16" as CIDR;

const X_FORWARDED_PROTO_HEADER = "X-Forwarded-Proto";

const proxyService: ServicePublic = {
  department_name: "Department name" as DepartmentName,
  organization_fiscal_code: "12431435345" as OrganizationFiscalCode,
  organization_name: "Organization name" as OrganizationName,
  service_id: "5a563817fcc896087002ea46c49a" as NonEmptyString,
  service_name: "Service name" as ServiceName,
  version: 42 as NonNegativeInteger
};

const newProxyService: ServicePublic = {
  department_name: "Department name" as DepartmentName,
  organization_fiscal_code: "12431435345" as OrganizationFiscalCode,
  organization_name: "Organization name" as OrganizationName,
  service_id: "5a563817fcc896087002ea46c49a" as NonEmptyString,
  service_name: "Service name" as ServiceName,
  version: 43 as NonNegativeInteger
};

describe("GET /services/:id", () => {
  const serviceApiUrl = `/api/v1/services/${proxyService.service_id}`;
  // tslint:disable:no-let
  let app: Express;
  beforeAll(async () => {
    app = await appModule.newApp(
      NodeEnvironmentEnum.PRODUCTION,
      aValidCIDR,
      aValidCIDR,
      "",
      "/api/v1",
      "/pagopa/api/v1"
    );
  });

  beforeEach(() => {
    jest.useRealTimers();
    apicache.clear(serviceApiUrl);
    mockGetService.mockReset();
    mockGetService.mockImplementationOnce(_ => {
      return Promise.resolve(ResponseSuccessJson(proxyService));
    });
    return request(app)
      .get(serviceApiUrl)
      .set(X_FORWARDED_PROTO_HEADER, "https")
      .expect(200);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    app.emit("server:stop");
  });

  it("Get services with valid cache", async () => {
    mockGetService.mockImplementationOnce(_ => {
      return Promise.resolve(ResponseSuccessJson(newProxyService));
    });
    const cachedResponse = await request(app)
      .get(serviceApiUrl)
      .set(X_FORWARDED_PROTO_HEADER, "https")
      .expect(200);
    expect(mockGetService).toBeCalledTimes(1);
    expect(cachedResponse.body).toEqual(proxyService);
  });

  it("Get services with invalid cache", done => {
    mockGetService.mockImplementationOnce(_ => {
      return Promise.resolve(ResponseSuccessJson(newProxyService));
    });
    // Waits that the cache of the resource expire
    setTimeout(async () => {
      const newResponse = await request(app)
        .get(serviceApiUrl)
        .set(X_FORWARDED_PROTO_HEADER, "https")
        .expect(200);
      expect(mockGetService).toBeCalledTimes(2);
      expect(newResponse.body).toEqual(newProxyService);
      expect(newResponse.header).toHaveProperty("cache-control");
      expect(newResponse.header["cache-control"]).toBe(
        `max-age=${expectedCacheDurationSeconds}`
      );
      done();
    }, (expectedCacheDurationSeconds + 1) * 1000);
  });
});
