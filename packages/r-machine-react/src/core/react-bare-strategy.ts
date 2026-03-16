import type { AnyLocale, AnyResourceAtlas } from "r-machine";
import { Strategy } from "r-machine/strategy";
import { createReactBareToolset, type ReactBareToolset } from "./react-bare-toolset.js";

export class ReactBareStrategy<RA extends AnyResourceAtlas, L extends AnyLocale> extends Strategy<RA, L, undefined> {
  createToolset(): Promise<ReactBareToolset<RA, L>> {
    return createReactBareToolset(this.rMachine);
  }
}
