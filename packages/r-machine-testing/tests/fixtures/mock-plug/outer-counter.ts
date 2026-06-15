import { OuterGear } from "./setup.js";

/**
 * Self-contained stateful OuterGear (no deps): exercises `$.state` + `$.ports`
 * + getter/action overrides for the resource-level test (§14.2).
 */
export const r = OuterGear.withPorts({
  persist: async (_count: number): Promise<void> => {
    throw new Error("persist port not mocked");
  },
})
  .withState({ count: 0, label: "init" })
  .define((plugin, _) => {
    const { $ } = plugin;
    return {
      count: _.getter(() => $.state.count),
      label: _.getter(() => $.state.label),
      bump: _.action((n: number) => ({ count: $.state.count + n })),
      save: async (): Promise<void> => {
        await $.ports.persist($.state.count);
      },
    };
  });
