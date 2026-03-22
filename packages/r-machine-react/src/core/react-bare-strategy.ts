import type { AnyFmtProvider, AnyResourceAtlas } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { Strategy } from "r-machine/strategy";
import { createReactBareToolset, type ReactBareToolset } from "./react-bare-toolset.js";

export class ReactBareStrategy<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  FP extends AnyFmtProvider,
> extends Strategy<RA, L, FP, undefined> {
  createToolset(): Promise<ReactBareToolset<RA, L, FP>> {
    return createReactBareToolset(this.rMachine);
  }
}
