import { OuterGear } from "./setup.js";

/**
 * Map-form consumer depending on the stateful `outer/probe` gear, whose getter
 * `view` returns an object deriving `a` from state (constant `b`). It re-exposes
 * that object as its own getter, so a test can mock the dep's `view` sub-key and
 * observe — through `ctrl.deps.probe.state` — that the un-mocked key keeps
 * tracking state (the live-merge law of `mergeLiveOverride`).
 */
export const r = OuterGear.withDeps({ probe: "outer/probe" }).define((plugin, _) => {
  const { probe } = plugin;
  return {
    probeView: _.getter(() => probe.view),
  };
});
