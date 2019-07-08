/**
 * This files contains the typescript declaration of module spid-passport.
 */

declare module "spid-passport";

interface IDPOption {
  // tslint:disable-next-line: readonly-array
  cert: string[];
  entityID: string;
  entryPoint: string;
  logoutUrl: string;
}
declare class SpidStrategy {
  // TODO: define types for constructor (see errors in spidStrategy.ts)
  // tslint:disable-next-line:no-any
  public logout(req: any, callback?: (err: any, request: any) => void): void;
  public generateServiceProviderMetadata(samlCert: string): string;
  public spidOptions: {
    idp: { [key: string]: IDPOption | undefined };
    // tslint:disable-next-line: no-any
    sp: any;
  };
}
