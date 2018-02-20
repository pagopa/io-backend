"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
{
    ApiClientFactoryInterface;
}
from;
"../services/apiClientFactoryInterface";
/**
 * Base class for all the controllers that need the apiClient service.
 */
class ControllerBase {
    /**
     * Class constructor.
     *
     * @param apiClient
     */
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
}
exports.default = ControllerBase;
//# sourceMappingURL=ControllerBase.js.map