/**
 * This files contains the typescript declaration of module passport-auth-token.
 */

declare module "passport-auth-token";

interface IVerifyOptions {
  readonly headerFields: readonly string[];
  readonly optional: boolean;
  readonly params: boolean;
  readonly passReqToCallback: boolean;
  readonly tokenFields: readonly string[];
}

type VerifyFunction = (
  token: string,
  done: (error: any, user?: any, options?: IVerifyOptions) => void,
) => void;

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
declare class Strategy {
  constructor(verify: VerifyFunction);
}
