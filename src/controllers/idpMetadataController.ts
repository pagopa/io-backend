import { Task } from "fp-ts/lib/Task";
import {
  IResponseSuccessJson,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { SuccessResponse } from "../types/commons";
import { log } from "../utils/logger";

export default class IdpMetadataController {
  constructor(private readonly idpMetadataRefresher: () => Task<void>) {}

  public async refresh(): Promise<IResponseSuccessJson<SuccessResponse>> {
    this.idpMetadataRefresher()
      .run()
      .then(() => {
        log.info("Refreshing of IDPs Metadata completed.");
      })
      .catch(err => log.error("Error on idpMetadataRefresher: %s", err));
    return ResponseSuccessJson({ message: "Updating IDPs Metadata" });
  }
}
