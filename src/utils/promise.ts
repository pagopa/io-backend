type Callback<E, T> = (err: E | null, reply: T) => void;

export interface ICommand<T, E, U, R> {
  (
    arg1: T,
    arg2: T,
    arg3: T,
    arg4: T,
    arg5: T,
    arg6: T,
    cb?: Callback<E, U>
  ): R;
  (arg1: T, arg2: T, arg3: T, arg4: T, arg5: T, cb?: Callback<E, U>): R;
  (arg1: T, arg2: T, arg3: T, arg4: T, cb?: Callback<E, U>): R;
  (arg1: T, arg2: T, arg3: T, cb?: Callback<E, U>): R;
  (arg1: T, arg2: T | ReadonlyArray<T>, cb?: Callback<E, U>): R;
  (arg1: T | ReadonlyArray<T>, cb?: Callback<E, U>): R;
  (...args: ReadonlyArray<T | Callback<E, U>>): R;
}

export function promisifyWithParams<T, E, U, R>(
  fn: ICommand<T, E, U, R>,
  params: ReadonlyArray<T>
): Promise<U> {
  return new Promise<U>((resolve, reject) => {
    if (params.length === 0) {
      return reject(new Error("Missing required params."));
    }
    fn(...params, (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
}
