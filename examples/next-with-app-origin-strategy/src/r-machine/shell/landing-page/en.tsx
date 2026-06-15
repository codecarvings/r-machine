import type { RShape } from "@/r-machine/setup";

export const r = {
  hero: {
    title: "Locale Routing with R-Machine",
    // Per-strategy tagline: says where the locale lives under this strategy.
    subtitle: "The locale lives in the domain — change it and the origin switches.",
    cta: {
      secondary: "GitHub Repository",
    },
  },
  timer: {
    title: "Client gear state",
    note: "The interval lives in an OuterGear, not in the component. Its state survives locale navigation.",
    unit: { one: "second", other: "seconds" },
  },
  playground: {
    title: "Try the routing",
    subtitle: "Follow the links and watch how the URL changes for the current locale.",
  },
};

export type Shell_LandingPage = RShape<typeof r>;
