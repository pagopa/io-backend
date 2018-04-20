/**
 *
 */

declare module "range_check" {
  function inRange(addr: string, range: string): boolean;
  function isV6(addr: string): boolean;
  function isV4(addr: string): boolean;
  function ver(addr: string): number;
}
