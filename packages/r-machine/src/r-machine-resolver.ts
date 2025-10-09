import type { RMachine } from "./index.js";
import type { AnyAtlas } from "./r.js";

export type RMachineToken = string | undefined;

export type RMachineResolver<A extends AnyAtlas = AnyAtlas> = (token: RMachineToken) => RMachine<A>;
