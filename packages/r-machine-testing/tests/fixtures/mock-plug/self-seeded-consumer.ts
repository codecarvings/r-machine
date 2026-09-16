import { OuterGear } from "./setup.js";

/**
 * Consumer of the self-seeding `outer/self-seeded` gear. Re-exposes the dep's
 * `lines` and the `bornTag` its factory saw, so a test can show that a
 * `ctrl.deps[0].state` seed lands AFTER the dependency was built.
 */
export const r = OuterGear.withDeps("outer/self-seeded").define((plugin, _) => {
  const [dep] = plugin;
  return {
    lines: _.getter(() => dep.lines),
    depBornTag: () => dep.bornTag(),
  };
});
