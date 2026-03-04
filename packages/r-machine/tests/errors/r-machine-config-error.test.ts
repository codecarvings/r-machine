import { RMachineConfigError } from "../../src/errors/r-machine-config-error.js";
import { describeErrorSubclass } from "../_fixtures/error-class-test-helper.js";

describeErrorSubclass("RMachineConfigError", RMachineConfigError);
