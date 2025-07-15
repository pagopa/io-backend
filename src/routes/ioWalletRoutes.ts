import { Express } from "express";
import * as passport from "passport";

import IoWalletController from "../controllers/ioWalletController";
import IoWalletService from "../services/ioWalletService";
import { toExpressHandler } from "../utils/express";

/**
 * Mount the Wallet routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the Wallet APIs
 * TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
 * @param basePathProxy The proxy base path for the Wallet APIs (RFC IOPLT-1156)
 * @param ioWalletService The service that handles the Wallet operations
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerIoWalletAPIRoutes = (
  app: Express,
  basePath: string,
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  basePathProxy: string,
  ioWalletService: IoWalletService,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>
): void => {
  const ioWalletController = new IoWalletController(ioWalletService);

  app.get(
    `${basePath}/nonce`,
    bearerSessionTokenAuth,
    toExpressHandler(ioWalletController.getNonce, ioWalletController)
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.get(
    `${basePathProxy}/nonce`,
    bearerSessionTokenAuth,
    toExpressHandler(ioWalletController.getNonce, ioWalletController)
  );

  app.post(
    `${basePath}/wallet-instances`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.createWalletInstance,
      ioWalletController
    )
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.post(
    `${basePathProxy}/wallet-instances`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.createWalletInstance,
      ioWalletController
    )
  );

  app.post(
    `${basePath}/token`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.createWalletAttestation,
      ioWalletController
    )
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.post(
    `${basePathProxy}/token`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.createWalletAttestation,
      ioWalletController
    )
  );

  app.post(
    `${basePath}/wallet-attestations`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.createWalletAttestationV2,
      ioWalletController
    )
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.post(
    `${basePathProxy}/wallet-attestations`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.createWalletAttestationV2,
      ioWalletController
    )
  );

  app.get(
    `${basePath}/wallet-instances/current/status`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.getCurrentWalletInstanceStatus,
      ioWalletController
    )
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.get(
    `${basePathProxy}/wallet-instances/current/status`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.getCurrentWalletInstanceStatus,
      ioWalletController
    )
  );

  app.get(
    `${basePath}/wallet-instances/:walletInstanceId/status`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.getWalletInstanceStatus,
      ioWalletController
    )
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.get(
    `${basePathProxy}/wallet-instances/:walletInstanceId/status`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.getWalletInstanceStatus,
      ioWalletController
    )
  );

  app.put(
    `${basePath}/wallet-instances/:walletInstanceId/status`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.setWalletInstanceStatus,
      ioWalletController
    )
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.put(
    `${basePathProxy}/wallet-instances/:walletInstanceId/status`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.setWalletInstanceStatus,
      ioWalletController
    )
  );

  app.get(
    `${basePath}/whitelisted-fiscal-code`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.isFiscalCodeWhitelisted,
      ioWalletController
    )
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.get(
    `${basePathProxy}/whitelisted-fiscal-code`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.isFiscalCodeWhitelisted,
      ioWalletController
    )
  );
};
