/**
 * Interface for the API client factories.
 */

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { PecBearerGeneratorT } from "src/types/token";
import { IPecServerClient } from "../clients/pecserver";

export interface IPecServerClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   */
  readonly getClient: (
    bearerGenerator: PecBearerGeneratorT,
    serviceId: O.Option<NonEmptyString>
  ) => TE.TaskEither<Error, ReturnType<IPecServerClient>>;
}
