// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const base64EncodeObject = (_: any): string =>
  Buffer.from(JSON.stringify(_)).toString("base64");
