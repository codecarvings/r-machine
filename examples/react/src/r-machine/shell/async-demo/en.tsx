import { type RShape, Shell } from "@/r-machine/setup";

// An async shell: the factory awaits before returning. Any consumer reading it
// suspends until it resolves.
export const r = Shell.define(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    badge: "Resolved",
    title: "Loaded asynchronously",
    body: "This shell awaited 1.5s before resolving — the consumer suspended and a fallback was shown until the data arrived.",
  };
});

export type Shell_AsyncDemo = RShape<typeof r>;
