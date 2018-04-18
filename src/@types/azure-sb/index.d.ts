/**
 * This files contains the typescript declaration overrides of module azure-sb.
 */

import { Azure } from "azure-sb";
import Callback = Azure.ServiceBus.ResponseCallback;

// This override is needed because the `installation` argument of `createOrUpdateInstallation` method is wrong.
// @see https://github.com/Azure/azure-sdk-for-node/issues/2450
declare module "azure-sb" {
  export interface Installation {
    readonly installationId: string;
    readonly platform: string;
    readonly pushChannel: string;
    readonly tags: ReadonlyArray<string>;
    readonly templates: {
      readonly [key: string]: {
        readonly body: string;
        readonly expiration?: string;
        readonly headers?: {};
        readonly tags?: ReadonlyArray<string>;
      };
    };
  }

  class NotificationHubService {
    public createOrUpdateInstallation(
      installation: Installation,
      callback: Callback
    ): void;
  }
}
