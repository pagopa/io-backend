/**
 * Stringify the Error
 * @param error
 * @returns A formatted string of the error.
 */
function getMessage(error: Error): string {
  return `value [${JSON.stringify(error)}]`;
}

/**
 * Merge into one single Error several errors provided in input and add a context description
 * @param errors
 * @param context
 * @returns A single Error instance with a formatted message.
 */
export function multipleErrorsFormatter(
  errors: ReadonlyArray<Error>,
  context: string
): Error {
  return new Error(
    errors
      .map(_ => {
        return getMessage(_);
      })
      .join(` at [context: ${context}]\n`)
  );
}
