import type { ApiClientFactoryInterface } from "../services/apiClientFactoryInterface";

/**
 * Base class for all the controllers that need the apiClient service.
 */
export default class ControllerBase {
  apiClient: ApiClientFactoryInterface;

  /**
   * Class constructor.
   *
   * @param apiClient
   */
  constructor(apiClient: ApiClientFactoryInterface) {
    this.apiClient = apiClient;
  }
}
