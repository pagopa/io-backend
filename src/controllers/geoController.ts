/**
 * This controller returns geo informations about logged user address input
 * - Manual
 * - Geolocalization
 */

import * as express from "express";
import {
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { withValidatedOrValidationError } from "../../src/utils/responses";
import { AddressQueryParams } from "../../generated/geo/AddressQueryParams";
import { LookupQueryParams } from "../../generated/geo/LookupQueryParams";
import { AutocompleteQueryParams } from "../../generated/geo/AutocompleteQueryParams";
import { OpenSearchAutocompleteResponse } from "../../generated/geo/OpenSearchAutocompleteResponse";
import { OpenSearchGeocodeResponse } from "../../generated/geo/OpenSearchGeocodeResponse";
import { LookupResponse } from "../../generated/geo/LookupResponse";
import GeoService from "../services/geoService";
import { withUserFromRequest } from "../types/user";

export default class GeoController {
  constructor(
    private readonly geoService: GeoService,
    private readonly hereApiKey: NonEmptyString
  ) {}

  public readonly getAutocomplete = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorGeneric
    | IResponseSuccessJson<OpenSearchAutocompleteResponse>
  > =>
    withUserFromRequest(req, async _ =>
      withValidatedOrValidationError(
        AutocompleteQueryParams.decode(req.query),
        autocompleteParams =>
          this.geoService.getAutocomplete(
            autocompleteParams.queryAddress,
            autocompleteParams.limit,
            this.hereApiKey
          )
      )
    );

  public readonly getGeocoding = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorGeneric
    | IResponseSuccessJson<OpenSearchGeocodeResponse>
  > =>
    withUserFromRequest(req, async _ =>
      withValidatedOrValidationError(
        AddressQueryParams.decode(req.query),
        addressParams =>
          this.geoService.getGeocoding(
            addressParams.queryAddress,
            this.hereApiKey
          )
      )
    );

  public readonly getLookup = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorGeneric
    | IResponseSuccessJson<LookupResponse>
  > =>
    withUserFromRequest(req, async _ =>
      withValidatedOrValidationError(
        LookupQueryParams.decode(req.query),
        lookupParams =>
          this.geoService.getLookup(lookupParams.id, this.hereApiKey)
      )
    );
}
