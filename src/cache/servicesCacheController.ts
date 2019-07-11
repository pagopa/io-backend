import * as express from "express";
import { Either, isLeft, isRight, left, right } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { RedisClient } from "redis";
import { ServicePublic } from "../../generated/backend/ServicePublic";
import ServicesController from "../controllers/servicesController";
import { log } from "../utils/logger";
import { parseCacheControlHeader } from "../utils/requests";

const servicePrefix = "SERVICE-";
const serviceCacheNotFoundError = new Error("Service not cached");
const defaultMaxAgeSeconds = 300;

export default class ServicesCacheController {
  constructor(
    private readonly serviceController: ServicesController,
    private redisClient: RedisClient
  ) {}

  /**
   * Returns the service identified by the provided id
   * code.
   */
  public readonly getService = async (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ServicePublic>
  > => {
    try {
      const cacheControlHeader = parseCacheControlHeader(req.headers);
      if (!cacheControlHeader["no-cache"]) {
        const cacheValue = await this.loadCachedService(req.params.id);
        if (isRight(cacheValue)) {
          return ResponseSuccessJson(cacheValue.value);
        }
      }
      const response = await this.serviceController.getService(req);
      if (
        response.kind === "IResponseSuccessJson" &&
        !cacheControlHeader["no-store"]
      ) {
        const newCachedService = await this.cacheService(
          response.value,
          cacheControlHeader["s-maxage"] ||
            cacheControlHeader["max-age"] ||
            defaultMaxAgeSeconds
        );
        if (isLeft(newCachedService) || newCachedService.value) {
          log.error("Service cache not updated.");
        }
      }
      return response;
    } catch (e) {
      return ResponseErrorInternal(e.toString());
    }
  };

  private loadCachedService(id: string): Promise<Either<Error, ServicePublic>> {
    return new Promise<Either<Error, ServicePublic>>(resolve => {
      this.redisClient.get(`${servicePrefix}${id}`, (err, value) => {
        if (err) {
          // Client returns an error.
          return resolve(left(err));
        }

        if (value === null) {
          return resolve(left(serviceCacheNotFoundError));
        }

        // Try-catch is needed because parse() may throw an exception.
        try {
          const servicePayload = JSON.parse(value);
          const errorOrDeserializedService = ServicePublic.decode(
            servicePayload
          );

          if (isLeft(errorOrDeserializedService)) {
            log.error(
              "Unable to decode the service: %s",
              ReadableReporter.report(errorOrDeserializedService)
            );
            return resolve(left(new Error("Unable to decode the service")));
          }

          const service = errorOrDeserializedService.value;
          return resolve(right(service));
        } catch (err) {
          return resolve(left(new Error("Unable to parse the service json")));
        }
      });
    });
  }

  private cacheService(
    service: ServicePublic,
    expire: number
  ): Promise<Either<Error, boolean>> {
    return new Promise<Either<Error, boolean>>(resolve => {
      const servicePayload = JSON.stringify(service);
      this.redisClient.set(
        `${servicePrefix}${service.service_id}`,
        servicePayload,
        "EX",
        expire,
        (err, value) => {
          if (err) {
            return resolve(left(err));
          }
          return resolve(right(value === "OK"));
        }
      );
    });
  }
}
