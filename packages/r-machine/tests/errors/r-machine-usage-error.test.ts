import { RMachineUsageError } from "../../src/errors/r-machine-usage-error.js";
import { describeErrorSubclass } from "../_fixtures/error-class-test-helper.js";

describeErrorSubclass("RMachineUsageError", RMachineUsageError);
