import { mockPlug } from "@r-machine/testing";
import { render } from "../src/render.ts";

// Black-box test of the example's actual output: what `render(locale)` returns.
// (Currency uses a non-breaking space before the symbol, so we assert the number
// and the symbol separately rather than the exact spacing.)
describe("render(locale) — the standalone CLI output", () => {
  it("renders the English greeting with en-US number + date formatting", async () => {
    const out = await render("en");

    expect(out).toContain("[en] Hello, Sergio!");
    expect(out).toContain("app: R-Machine Standalone");
    expect(out).toContain("$12,345.60"); // en-US: comma grouping, dot decimal, leading $
    expect(out).toContain("June 25, 2026"); // en-US long date
  });

  it("renders the Italian greeting with it-IT number + date formatting", async () => {
    const out = await render("it");

    expect(out).toContain("[it] Ciao, Sergio!");
    expect(out).toContain("app: R-Machine Standalone");
    expect(out).toContain("12.345,60"); // it-IT: dot grouping, comma decimal
    expect(out).toContain("€");
    expect(out).toContain("25 giugno 2026"); // it-IT long date
  });

  it("renders two lines per locale", async () => {
    expect((await render("en")).split("\n")).toHaveLength(2);
  });
});

// `mockPlug` is the single, uniform testing primitive. Here it mocks the REAL
// plug the renderer uses (carried as `render.plug`) and the REAL `render` runs
// against it — no application code is re-declared in the test.
//
// We substitute a DEPENDENCY (not the locale: DirectPlug's locale is explicit,
// so a `$.locale` override would be a no-op). The plug is list-form
// `DirectPlug("shell/greeting", "base/config")`, so key `0` is the greeting shell.
describe("render(locale) — with a mocked dependency", () => {
  it("mockPlug substitutes the greeting shell; render reflects it (other deps stay real)", async () => {
    using _ctrl = mockPlug(render).with({
      0: { title: "Mock", greet: (name: string) => `MOCK ${name}` },
    });

    const out = await render("en");

    expect(out).toContain("MOCK Sergio"); // greeting came from the mock
    expect(out).toContain("app: R-Machine Standalone"); // base/config still resolved for real
  });
});
