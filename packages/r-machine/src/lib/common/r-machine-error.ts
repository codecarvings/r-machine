export class RMachineError extends Error {
  constructor(
    message: string,
    public readonly innerError?: Error
  ) {
    super(`R-Machine Error: ${message}`);
    this.name = "RMachineError";
  }
}
