export class RMachineError extends Error {
  constructor(
    readonly code: string,
    message: string,
    public readonly innerError?: Error
  ) {
    super(`R-Machine Error [${code}]: ${message}`);
    this.name = "RMachineError";
  }
}
