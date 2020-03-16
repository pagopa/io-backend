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
    // tslint:disable-next-line: no-floating-promises
    this.idpMetadataRefresher()
      .run()
      .then(() => {
        log.info("Refreshing of IDPs Metadata completed.");
      });
    return ResponseSuccessJson({ message: "Updating IDPs Metadata" });
  }
}
