import type { RShape } from "../../setup.ts";

// Canonical locale file — defines the shape every variant is checked against.
export const r = {
  title: "Welcome",
  greet: (name: string) => `Hello, ${name}!`,
};

export type Shell_Greeting = RShape<typeof r>;
