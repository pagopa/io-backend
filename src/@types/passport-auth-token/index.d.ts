/**
 * This files contains the typescript declaration of module passport-auth-token.
 */

declare module "passport-auth-token";

interface IVerifyOptions {
  readonly tokenFields: ReadonlyArray<string>;
  readonly headerFields: ReadonlyArray<string>;
  readonly passReqToCallback: boolean;
  readonly params: boolean;
  readonly optional: boolean;
}

type VerifyFunction = (
  token: string,
  // tslint:disable-next-line:no-any
  done: (error: any, user?: any, options?: IVerifyOptions) => void
) => void;

declare class Strategy {
  constructor(verify: VerifyFunction);
}
