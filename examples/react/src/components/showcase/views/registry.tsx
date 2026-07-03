import type { ComponentType } from "react";
// Real source files, imported raw so the snippets never drift from the code.
import previewSrc from "@/r-machine/pub/base/preview.ts?raw";
import type { ViewId } from "@/r-machine/pub/outer/nav";
import navSrc from "@/r-machine/pub/outer/nav.ts?raw";
import operatorSrc from "@/r-machine/pub/outer/operator.ts?raw";
import timerSrc from "@/r-machine/pub/outer/timer.ts?raw";
import asyncShellSrc from "@/r-machine/pub/shell/async-demo/en.tsx?raw";
import fmtSrc from "@/r-machine/pub/shell/lib/fmt.ts?raw";
import showcaseShellSrc from "@/r-machine/pub/shell/showcase/it.tsx?raw";
import counterSrc from "@/r-machine/pub/vertex/counter.ts?raw";
import sidebarSrc from "../sidebar.tsx?raw";
import { AsyncDemo } from "./async-demo";
import asyncDemoSrc from "./async-demo.tsx?raw";
import { CrossLocaleDemo } from "./cross-locale-demo";
import crossLocaleDemoSrc from "./cross-locale-demo.tsx?raw";
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
      { label: "r-machine/pub/outer/nav.ts", lang: "ts", code: navSrc },
      { label: "components/showcase/sidebar.tsx", lang: "tsx", code: sidebarSrc },
    ],
  },
  "outer-gear": {
    Demo: OuterGearDemo,
    sources: [
      { label: "r-machine/pub/outer/timer.ts", lang: "ts", code: timerSrc },
      { label: "OuterGearDemo.tsx", lang: "tsx", code: outerGearDemoSrc },
    ],
  },
  "gear-deps": {
    Demo: GearDepsDemo,
    sources: [
      { label: "r-machine/pub/outer/operator.ts", lang: "ts", code: operatorSrc },
      { label: "GearDepsDemo.tsx", lang: "tsx", code: gearDepsDemoSrc },
    ],
  },
  vertex: {
    Demo: VertexDemo,
    sources: [
      { label: "r-machine/pub/vertex/counter.ts", lang: "ts", code: counterSrc },
      { label: "VertexDemo.tsx", lang: "tsx", code: vertexDemoSrc },
    ],
  },
  async: {
    Demo: AsyncDemo,
    sources: [
      { label: "r-machine/pub/shell/async-demo/en.tsx", lang: "tsx", code: asyncShellSrc },
      { label: "AsyncDemo.tsx", lang: "tsx", code: asyncDemoSrc },
    ],
  },
  formatting: {
    Demo: FormattingDemo,
    sources: [
      { label: "r-machine/pub/shell/lib/fmt.ts", lang: "ts", code: fmtSrc },
      { label: "FormattingDemo.tsx", lang: "tsx", code: formattingDemoSrc },
    ],
  },
  localization: {
    Demo: LocalizationDemo,
    sources: [
      { label: "r-machine/pub/shell/showcase/it.tsx (localized)", lang: "tsx", code: showcaseShellSrc },
      { label: "LocalizationDemo.tsx", lang: "tsx", code: localizationDemoSrc },
    ],
  },
  crossLocale: {
    Demo: CrossLocaleDemo,
    sources: [
      { label: "r-machine/pub/base/preview.ts", lang: "ts", code: previewSrc },
      { label: "CrossLocaleDemo.tsx", lang: "tsx", code: crossLocaleDemoSrc },
    ],
  },
};
