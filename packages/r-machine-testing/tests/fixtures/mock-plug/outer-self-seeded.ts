import { OuterGear } from "./setup.js";

/**
 * Stateful OuterGear that seeds ITSELF from a port inside an async factory — the
 * SSR-hydration pattern (`_.action()(await $.ports.…)`). The snapshot writes
 * `lines` only; `tag` is never touched by it. `bornTag` captures the state the
 * factory body saw, so a test can tell WHEN a controller seed landed: before the
 * factory (own state) or after the resource was built (a dependency). Also
 * loaded by namespace as `outer/self-seeded` (see setup.ts).
 */
export const r = OuterGear.withPorts({
  loadSnapshot: async () => ({ lines: ["port"] }),
})
  .withState({ lines: [] as string[], tag: "init" })
  .define(async (plugin, _) => {
    const { $ } = plugin;
    const bornTag = $.state.tag;
    _.action()(await $.ports.loadSnapshot());
    return {
      lines: _.getter(() => $.state.lines),
      tag: _.getter(() => $.state.tag),
      // A function, not a plain value: OuterGear members must be callable.
      bornTag: () => bornTag,
    };
  });
