/**
 * Base class for all the controllers that need the apiClient service.
 */
import { IApiClientFactoryInterface } from "../services/iApiClientFactory";

export default class ControllerBase {
  protected readonly apiClient: IApiClientFactoryInterface;

  /**
   * Class constructor.
   *
   * @param apiClient
   */
  constructor(apiClient: IApiClientFactoryInterface) {
    this.apiClient = apiClient;
  }
}
