import { InnerGear } from "./setup.js";

/**
 * List-form resource: a single positional dep (`inner/double`). Exercises the
 * positional override key (`0`) in mockPlug.
 */
export const r = InnerGear.withDeps("inner/double").define((plugin) => {
  const [doubler] = plugin;
  return {
    quadruple: (n: number): number => doubler.double(doubler.double(n)),
  };
});
