import type { AnyAtlas } from "r-machine";
import { Strategy } from "r-machine/strategy";
import { createReactBareToolset, type ReactBareToolset } from "#r-machine/react/core";

export class ReactBareStrategy<A extends AnyAtlas> extends Strategy<A, undefined> {
  protected toolsetPromise: Promise<ReactBareToolset<A>> | undefined;
  getToolset(): Promise<ReactBareToolset<A>> {
    if (this.toolsetPromise === undefined) {
      this.toolsetPromise = (async () => {
        return await createReactBareToolset(this.rMachine);
      })();
    }
    return this.toolsetPromise;
  }
}
