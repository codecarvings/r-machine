import type { AnyAtlas } from "r-machine";
import { Strategy } from "r-machine/strategy";
import { createReactBareToolset, type ReactBareToolset } from "#r-machine/react/core";

export class ReactBareStrategy<A extends AnyAtlas> extends Strategy<A, undefined> {
  createToolset(): Promise<ReactBareToolset<A>> {
    return createReactBareToolset(this.rMachine);
  }
}
