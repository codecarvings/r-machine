import type { RShape } from "@/r-machine/setup";

export const r = {
  appName: "R-Machine × React",
  tagline: "A feature tour — no router required.",

  // Sidebar labels, keyed by ViewId
  nav: {
    intro: "Intro",
    "outer-gear": "OuterGear",
    "gear-deps": "Gear dependencies",
    vertex: "Vertex",
    async: "Async + Suspense",
    formatting: "Formatting",
    localization: "Localization",
  },

  // Per-view heading + blurb
  views: {
    intro: {
      heading: "The router is a gear",
      blurb:
        "This app has no router. The active view is the state of an OuterGear (outer/nav) — switching views is just an action. Because OuterGear state is client-session state, your selected view even survives an HMR reload.",
    },
    "outer-gear": {
      heading: "OuterGear — reactive state",
      blurb:
        "Actions mutate state, getters read it, a memoized cell derives from it, and a relay reacts to changes. The interval lives in the gear with Symbol.dispose cleanup.",
    },
    "gear-deps": {
      heading: "Gear dependencies",
      blurb:
        "operator depends on timer, declared by token and injected fully typed — no imports, no manual wiring. Read its derived value and command it.",
    },
    vertex: {
      heading: "Vertex + VertexFrame",
      blurb:
        "A vertex gear gives each consumer its own instance by default. Wrap consumers in a <VertexFrame> and they share one instance instead.",
    },
    async: {
      heading: "Async shells + Suspense",
      blurb:
        "A shell can be async. The consumer suspends until it resolves; DelayedSuspense shows a fallback only if the wait is long enough to notice.",
    },
    formatting: {
      heading: "Locale-aware formatting",
      blurb:
        "A mono shell wraps the native Intl APIs. Numbers, currency, dates and plurals reformat automatically when you switch locale.",
    },
    localization: {
      heading: "Localization without a router",
      blurb:
        "Every string here comes from a localized shell. Switching locale is persisted to localStorage and survives a reload — no URL, no router.",
    },
  },

  formatting: {
    dateLabel: "Date",
    numberLabel: "Number",
    currencyLabel: "Currency",
    pluralLabel: "Plural",
    countLabel: "Items",
    unit: { one: "item", other: "items" },
  },

  localization: {
    currentLocaleLabel: "Current locale",
    note: "Pick a language from the top-right switcher. The choice is stored in localStorage and reapplied on reload.",
  },
};

export type Shell_Showcase = RShape<typeof r>;
