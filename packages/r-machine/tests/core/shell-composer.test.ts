import { describe, expect, it, vi } from "vitest";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResLayout } from "../../src/core/res-layout.js";
import { tryGetResMatrixMeta } from "../../src/core/res-matrix.js";
import { createShellComposer } from "../../src/core/shell-composer.js";
import { buildResolveEnv, makeConnector, shellModule } from "../_fixtures/build-resolve-env.js";

const LAYOUT: AnyResLayout = { "s/": "shell", "m/": "shell(mono)", "b/": "gear:base" };

describe("Shell composer — construction", () => {
  it("define() returns a ResMatrix tagged family=shell without invoking the factory", () => {
    const composer = createShellComposer<any, any, any, any>(makeConnector({} as never));
    const factory = vi.fn(() => ({ hi: "x" }));

    const matrix = composer.define(factory);

    expect(factory).not.toHaveBeenCalled();
    expect(typeof matrix.create).toBe("function");
    expect(matrix.plug).toBeDefined();
    expect(tryGetResMatrixMeta(matrix as never)).toEqual({ family: "shell" });
  });
});

describe("Shell composer — resolution through the full stack", () => {
  it("factory `$.locale` carries the active locale (shell is locale-aware)", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "s/greeting": shellModule((c) => c.define(({ $ }: any) => ({ text: `Hello (${$.locale})` }))),
    });

    const en = (await env.resolve("s/greeting" as AnyNamespace, "en")) as { text: string };
    const it = (await env.resolve("s/greeting" as AnyNamespace, "it")) as { text: string };

    expect(en.text).toBe("Hello (en)");
    expect(it.text).toBe("Hello (it)");
  });

  it("shell(mono) factory also receives `$.locale`", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "m/fmt": shellModule((c) => c.define(({ $ }: any) => ({ loc: $.locale }))),
    });

    expect(((await env.resolve("m/fmt" as AnyNamespace, "it")) as { loc: string }).loc).toBe("it");
  });

  it("withPorts({...}) async loading → `$.ports.*` with `$.locale`", async () => {
    const fetchCopy = async (locale: string) => ({ hero: `hero-${locale}` });
    const env = buildResolveEnv(LAYOUT, {
      "s/home": shellModule((c) =>
        (c.withPorts as any)({ fetchCopy }).define(async ({ $ }: any) => ({
          hero: (await $.ports.fetchCopy($.locale)).hero,
        }))
      ),
    });

    expect(((await env.resolve("s/home" as AnyNamespace, "en")) as { hero: string }).hero).toBe("hero-en");
  });

  it("shell can depend on a base gear (bridgeGears path)", async () => {
    const env = buildResolveEnv(LAYOUT, {
      // A base gear backed by a raw-resource module (plain object resource).
      "b/config": () => ({ r: { apiBase: "api" } as never }),
      "s/page": shellModule((c) =>
        (c.withDeps as any)("b/config").define(([config, $]: any) => ({
          welcome: `Welcome ${config.apiBase} (${$.locale})`,
        }))
      ),
    });

    expect(((await env.resolve("s/page" as AnyNamespace, "en")) as { welcome: string }).welcome).toBe(
      "Welcome api (en)"
    );
  });
});
