import { localized } from "@/r-machine/setup.ts";

// Variant file — `localized(...)` exact-key type-checks against the canonical
// `en` shape: a missing or extra key is a compile error.
export const r = localized("shell/greeting", {
  title: "Benvenuto",
  greet: (name: string) => `Ciao, ${name}!`,
});
