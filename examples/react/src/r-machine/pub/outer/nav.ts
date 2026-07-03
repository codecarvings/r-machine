import { OuterGear, type RShape } from "@/r-machine/setup";

// The "router" of this showcase is just an OuterGear holding the active view.
// Because OuterGear state is client-session state, the selected view even
// survives HMR reloads.
export const VIEW_IDS = [
  "intro",
  "outer-gear",
  "gear-deps",
  "vertex",
  "async",
  "formatting",
  "localization",
  "crossLocale",
] as const;

export type ViewId = (typeof VIEW_IDS)[number];

export const r = OuterGear.withState({ view: "intro" as ViewId }).define((plugin, _) => {
  const { $ } = plugin;

  return {
    view: _.getter(() => $.state.view),
    setView: _.action((view: ViewId) => ({ view })),
  };
});

export type Outer_Nav = RShape<typeof r>;
