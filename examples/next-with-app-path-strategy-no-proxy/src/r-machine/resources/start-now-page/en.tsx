import type { R } from "r-machine";

const r = {
  backToHome: "Back to Home",
  documentation: {
    title: "Documentation",
    description: "Learn how to use R-Machine with comprehensive guides, API references, and best practices.",
    link: "https://r-machine.codecarvings.com/en/docs/",
  },
  examples: {
    title: "Available Examples",
    description:
      "R-Machine includes multiple examples demonstrating different implementation strategies for React and Next.js applications. Each example showcases different locale routing approaches and configuration options to help you choose the best strategy for your project.",
  },
};

export default r;
export type R_StartNowPage = R<typeof r>;
