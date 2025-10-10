import { RMachine } from "./index.js";
import type { AnyAtlas } from "./r.js";
import { RMachineError } from "./r-machine-error.js";

export type RMachineToken = string | undefined;

export type RMachineDynamicResolver<A extends AnyAtlas> = (token: RMachineToken) => RMachine<A>;

export type RMachineResolver<A extends AnyAtlas> = RMachine<A> | RMachineDynamicResolver<A>;

export function resolveRMachine<A extends AnyAtlas>(resolver: RMachineResolver<A>, token: RMachineToken): RMachine<A> {
  if (resolver instanceof RMachine) {
    return resolver;
  }

  const rMachine = resolver(token);
  if (!rMachine) {
    throw new RMachineError(`RMachine not found for the given token "${token}"`);
  }
  return rMachine;
}
