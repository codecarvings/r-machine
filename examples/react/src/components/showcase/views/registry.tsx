import type { ComponentType } from "react";
import type { ViewId } from "@/r-machine/outer/nav";

// Real source files, imported raw so the snippets never drift from the code.
import navSrc from "@/r-machine/outer/nav.ts?raw";
import operatorSrc from "@/r-machine/outer/operator.ts?raw";
import timerSrc from "@/r-machine/outer/timer.ts?raw";
import asyncShellSrc from "@/r-machine/shell/async-demo/en.tsx?raw";
import fmtSrc from "@/r-machine/shell/lib/fmt.ts?raw";
import showcaseShellSrc from "@/r-machine/shell/showcase/it.tsx?raw";
import counterSrc from "@/r-machine/vertex/counter.ts?raw";
import sidebarSrc from "../sidebar.tsx?raw";
import { AsyncDemo } from "./async-demo";
import asyncDemoSrc from "./async-demo.tsx?raw";
import { FormattingDemo } from "./formatting-demo";
import formattingDemoSrc from "./formatting-demo.tsx?raw";
import { GearDepsDemo } from "./gear-deps-demo";
import gearDepsDemoSrc from "./gear-deps-demo.tsx?raw";
import { IntroDemo } from "./intro-demo";
import { LocalizationDemo } from "./localization-demo";
import localizationDemoSrc from "./localization-demo.tsx?raw";
import { OuterGearDemo } from "./outer-gear-demo";
import outerGearDemoSrc from "./outer-gear-demo.tsx?raw";
import { VertexDemo } from "./vertex-demo";
import vertexDemoSrc from "./vertex-demo.tsx?raw";

type Source = { label: string; lang: "ts" | "tsx"; code: string };
type ViewEntry = { Demo: ComponentType; sources: Source[] };

export const VIEWS: Record<ViewId, ViewEntry> = {
  intro: {
    Demo: IntroDemo,
    sources: [
      { label: "r-machine/outer/nav.ts", lang: "ts", code: navSrc },
      { label: "components/showcase/sidebar.tsx", lang: "tsx", code: sidebarSrc },
    ],
  },
  "outer-gear": {
    Demo: OuterGearDemo,
    sources: [
      { label: "r-machine/outer/timer.ts", lang: "ts", code: timerSrc },
      { label: "OuterGearDemo.tsx", lang: "tsx", code: outerGearDemoSrc },
    ],
  },
  "gear-deps": {
    Demo: GearDepsDemo,
    sources: [
      { label: "r-machine/outer/operator.ts", lang: "ts", code: operatorSrc },
      { label: "GearDepsDemo.tsx", lang: "tsx", code: gearDepsDemoSrc },
    ],
  },
  vertex: {
    Demo: VertexDemo,
    sources: [
      { label: "r-machine/vertex/counter.ts", lang: "ts", code: counterSrc },
      { label: "VertexDemo.tsx", lang: "tsx", code: vertexDemoSrc },
    ],
  },
  async: {
    Demo: AsyncDemo,
    sources: [
      { label: "r-machine/shell/async-demo/en.tsx", lang: "tsx", code: asyncShellSrc },
      { label: "AsyncDemo.tsx", lang: "tsx", code: asyncDemoSrc },
    ],
  },
  formatting: {
    Demo: FormattingDemo,
    sources: [
      { label: "r-machine/shell/lib/fmt.ts", lang: "ts", code: fmtSrc },
      { label: "FormattingDemo.tsx", lang: "tsx", code: formattingDemoSrc },
    ],
  },
  localization: {
    Demo: LocalizationDemo,
    sources: [
      { label: "r-machine/shell/showcase/it.tsx (localized)", lang: "tsx", code: showcaseShellSrc },
      { label: "LocalizationDemo.tsx", lang: "tsx", code: localizationDemoSrc },
    ],
  },
};
