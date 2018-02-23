/**
 *
 */

declare module "spid-passport";

declare class SpidStrategy {
  public logout(req: any, callback?: (any, any) => void): void;
  public generateServiceProviderMetadata(samlCert: string): void;
}
