/**
 *
 */

declare module "spid-passport";

declare class SpidStrategy {
  // TODO: define types for constructor (see errors in spidStrategy.ts)
  public logout(req: any, callback?: (any, any) => void): void;
  public generateServiceProviderMetadata(samlCert: string): void;
}
