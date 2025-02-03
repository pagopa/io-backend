export const TimeTracer = () => {
  const startTime: bigint = process.hrtime.bigint();
  return {
    getElapsedMilliseconds: (): bigint =>
      (process.hrtime.bigint() - startTime) / BigInt(1000000)
  };
};
