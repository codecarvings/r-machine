import type { RShape } from "@/r-machine/setup";

export const r = {
  hero: {
    title: "Type-Safe i18n for Modern Applications",
    subtitle:
      "R-Machine brings fully type-safe internationalization to your React apps with minimal runtime overhead and superior developer experience.",
    cta: {
      primary: "Get Started",
      secondary: "GitHub Repository",
    },
  },
  features: {
    title: "Why R-Machine?",
    subtitle: "Built for developers who demand type safety and performance.",
  },
};

export type Shell_LandingPage = RShape<typeof r>;
