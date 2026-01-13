import type { AnyResourceAtlas } from "r-machine";
import { Strategy } from "r-machine/strategy";
import { createReactBareToolset, type ReactBareToolset } from "#r-machine/react/core";

export class ReactBareStrategy<RA extends AnyResourceAtlas> extends Strategy<RA, undefined> {
  createToolset(): Promise<ReactBareToolset<RA>> {
    return createReactBareToolset(this.rMachine);
  }
}
