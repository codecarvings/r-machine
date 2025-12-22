import type { AnyAtlas } from "r-machine";
import { Strategy } from "r-machine/strategy";
import { createReactToolset, type ReactToolset } from "#r-machine/react/core";

export class ReactStrategy<A extends AnyAtlas, C> extends Strategy<A, C> {
  protected toolsetPromise: Promise<ReactToolset<A>> | undefined;
  getToolset(): Promise<ReactToolset<A>> {
    if (this.toolsetPromise === undefined) {
      this.toolsetPromise = (async () => {
        return await createReactToolset(this.rMachine);
      })();
    }
    return this.toolsetPromise;
  }
}
