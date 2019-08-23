function getMessage(error: Error): string {
  return `value [${JSON.stringify(error)}]`;
}

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
