import { OuterGear } from "./setup.js";

/**
 * Map-form consumer: depends on the stateful `outer/shared` gear under a NAMED
 * key. Exercises mockPlug's controller object-branch bind (named deps → the
 * `ctrl.deps.shared` handle) as opposed to the positional/list form covered by
 * `shared-consumer`.
 */
export const r = OuterGear.withDeps({ shared: "outer/shared" }).define((plugin, _) => {
  const { shared } = plugin;
  return {
    sharedValue: _.getter(() => shared.value),
    bumpShared: (): void => shared.inc(),
  };
});
