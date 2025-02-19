import { Express } from "express";

import IoWalletController from "../controllers/ioWalletController";
import IoWalletService from "../services/ioWalletService";
import { toExpressHandler } from "../utils/express";

export const registerIoWalletAPIRoutes = (
  app: Express,
  basePath: string,
  ioWalletService: IoWalletService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void => {
  const ioWalletController = new IoWalletController(ioWalletService);

  app.get(
    `${basePath}/nonce`,
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

  app.post(
    `${basePath}/token`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.createWalletAttestation,
      ioWalletController
    )
  );

  // TODO SIW-1843
  app.put(
    `${basePath}/wallet-instances/current/status`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.setCurrentWalletInstanceStatus,
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

  app.put(
    `${basePath}/wallet-instances/:walletInstanceId/status`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.setWalletInstanceStatus,
      ioWalletController
    )
  );
};
