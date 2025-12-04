import type { R } from "r-machine";

const r = {
  hero: {
    title: "Type-Safe i18n for Modern Applications",
    subtitle:
      "R-Machine brings fully type-safe internationalization to your Next.js apps with minimal runtime overhead and exceptional developer experience.",
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

export default r;
export type R_LandingPage = R<typeof r>;
