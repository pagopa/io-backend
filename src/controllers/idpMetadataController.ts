import { Task } from "fp-ts/lib/Task";
import {
  IResponseSuccessJson,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { SuccessResponse } from "../types/commons";

export default class IdpMetadataController {
  constructor(private readonly idpMetadataRefresher: () => Task<void>) {}

  public async refresh(): Promise<IResponseSuccessJson<SuccessResponse>> {
    await this.idpMetadataRefresher().run();
    return ResponseSuccessJson({ message: "IDPs Metadata Updated" });
  }
}
