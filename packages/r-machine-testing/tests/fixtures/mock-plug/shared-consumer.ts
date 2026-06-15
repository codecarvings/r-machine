import { OuterGear } from "./setup.js";

/**
 * Consumer that depends on the stateful `outer/shared` gear. Because deps are
 * resolved by namespace and cached process-tier, the dep's state cell survives
 * across `r.create()` calls — the leak `disposeResources` is meant to clear.
 */
export const r = OuterGear.withDeps("outer/shared").define((plugin, _) => {
  const [shared] = plugin;
  return {
    sharedValue: _.getter(() => shared.value),
    bumpShared: (): void => shared.inc(),
  };
});
