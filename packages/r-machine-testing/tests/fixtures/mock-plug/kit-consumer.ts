import { InnerGear } from "./setup.js";

/**
 * Reads the machine-wide `helper` kit entry both ways: via `$.kit.helper` and
 * via the hoisted top-level `plugin.helper`. Lets the kit-override suite assert
 * the override applies to both and that they are the same surface object.
 */
export const r = InnerGear.define((plugin) => ({
  viaKit: (): string => plugin.$.kit.helper.greet("x"),
  viaHoist: (): string => plugin.helper.greet("x"),
  viaShout: (): string => plugin.$.kit.helper.shout(),
  sameRef: (): boolean => plugin.helper === plugin.$.kit.helper,
}));
