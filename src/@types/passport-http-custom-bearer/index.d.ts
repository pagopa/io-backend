/**
 * This files contains the typescript declaration of module passport-auth-token.
 */

declare module "passport-http-custom-bearer" {
  import express = require("express");
  import koa = require("koa");
  import passport = require("passport");

  interface IStrategyOptions {
    bodyName?: string;
    headerName?: string;
    passReqToCallback?: boolean | undefined;
    queryName?: string;
    realm?: string | undefined;
    scope?: string | string[] | undefined;
  }
  interface IVerifyOptions {
    message?: string | undefined;
    scope: string | string[];
  }

  type VerifyFunction = (
    token: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    done: (error: any, user?: any, options?: IVerifyOptions | string) => void,
  ) => void;

  interface IKoaContextContainer {
    ctx: koa.Context;
  }
  type KoaPassportExpressRequestMock = IKoaContextContainer &
    Partial<express.Request>;

  type VerifyFunctionWithRequest = (
    req: express.Request,
    token: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    done: (error: any, user?: any, options?: IVerifyOptions | string) => void,
  ) => void;
  type VerifyFunctionWithContext = (
    req: KoaPassportExpressRequestMock,
    token: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    done: (error: any, user?: any, options?: IVerifyOptions | string) => void,
  ) => void;

  type VerifyFunctions =
    | VerifyFunction
    | VerifyFunctionWithContext
    | VerifyFunctionWithRequest;

  class Strategy<T extends VerifyFunctions> implements passport.Strategy {
    name: string;
    constructor(verify: VerifyFunction);

    constructor(options: IStrategyOptions, verify: T);
    // eslint-disable-next-line @typescript-eslint/ban-types
    authenticate(req: express.Request, options?: Object): void;
  }
}
