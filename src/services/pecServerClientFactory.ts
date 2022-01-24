import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { IPecServerClient, pecServerClient } from "../clients/pecserver";
import {
  PecServersConfig,
  PecServerConfig,
  getHttpApiFetchWithBearer
} from "../config";
import { IPecServerClientFactoryInterface } from "./IPecServerClientFactory";

const findById = (sources: PecServersConfig, serviceId: NonEmptyString) =>
  O.fromNullable(
    Object.values(sources)
      .filter(PecServerConfig.is)
      .find(c => c.serviceId === serviceId)
  );

export default class PecServerClientFactory
  implements IPecServerClientFactoryInterface {
  constructor(private readonly pecConfigs: PecServersConfig) {}

  /**
   * {@inheritDoc}
   */
  public getClient(
    bearerGenerator: (config: PecServerConfig) => TE.TaskEither<Error, string>,
    maybeServiceId: O.Option<NonEmptyString>
  ): TE.TaskEither<Error, ReturnType<IPecServerClient>> {
    const pecServerConfig = maybeServiceId
      .chain(serviceId => findById(this.pecConfigs, serviceId))
      .getOrElse(this.pecConfigs.poste);

    return bearerGenerator(pecServerConfig).map(token =>
      pecServerClient(
        pecServerConfig.url,
        pecServerConfig.basePath,
        getHttpApiFetchWithBearer(token)
      )
    );
  }
}
