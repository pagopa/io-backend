// tslint:disable:no-any

"use strict";

/**
 * {@inheritDoc}
 */
export default class RedisClient {
  public readonly map: any;

  /**
   * Class constructor.
   */
  constructor() {
    this.map = new Map();
  }

  /**
   * {@inheritDoc}
   * @see https://redis.io/commands/set
   */
  public set(key: string, value: string): number {
    // return 0 if field already exists in the hash and the value was updated.
    if (this.map.get(key) !== undefined) {
      this.map.set(key, value);
      return 0;
    }
    // return 1 if field is a new field in the hash and value was set.
    this.map.set(key, value);
    return 1;
  }

  /**
   * {@inheritDoc}
   */
  public get(
    key: string,
    callback: (err: any, value: any) => void
  ): string | void {
    const err = undefined;

    return callback(err, this.map.get(key));
  }

  /**
   * {@inheritDoc}
   */
  public hdel(_: string, key: string): void {
    this.map.delete(key);
  }
}
