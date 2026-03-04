import { RMachineError } from "./r-machine-error.js";

export class RMachineUsageError extends RMachineError {
  constructor(code: string, message: string, innerError?: Error) {
    super(code, message, innerError);
    this.name = "RMachineUsageError";
  }
}
