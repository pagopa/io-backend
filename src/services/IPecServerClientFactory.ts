/**
 * Interface for the API client factories.
 */

import * as TE from "fp-ts/lib/TaskEither";
import { IPecServerClient } from "../clients/pecserver";
import { PecServerConfig } from "../config";

export interface IPecServerClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   */
  readonly getClient: (
    bearerGenerator: (config: PecServerConfig) => TE.TaskEither<Error, string>,
    serviceId: string | undefined
  ) => TE.TaskEither<Error, ReturnType<IPecServerClient>>;
}
