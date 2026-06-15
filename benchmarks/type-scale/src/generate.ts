/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of r-machine, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

/**
 * Deterministic generator: emits one realistic R-Machine project of N resources
 * into generated/<N>/. Realistic distribution (~50% OuterGear / 20% BaseGear /
 * 30% Shell), acyclic deps to earlier compatible resources, a mix of list/map
 * dep modes and string/token references, and a small share of `#`-internal base
 * gears. Shells are ~half plain-object and ~half `Shell.define((plugin) => …)`,
 * both carrying string + function + JSX members; one shell(mono) `fmt` formatter
 * is always emitted (atlas size = N + 1). Run: `tsx src/generate.ts --n 100`.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { projectDir, SEED } from "./config.js";
import { Prng } from "./prng.js";
import {
  type FixtureAnchors,
  type Kind,
  type ResSpec,
  renderBase,
  renderCompileTsconfig,
  renderFixture,
  renderFmtShell,
  renderOuterDeps,
  renderOuterStateful,
  renderResourceAtlas,
  renderSetup,
  renderShellDefineVariant,
  renderShellVariant,
  renderTokens,
  renderToolset,
  renderTsconfig,
} from "./templates.js";

function plan(n: number, prng: Prng): ResSpec[] {
  const nShell = Math.round(n * 0.3);
  const nBase = Math.round(n * 0.2);
  const nOuter = n - nShell - nBase;
  const nOuterStateful = Math.ceil(nOuter / 2);
  const nOuterDeps = nOuter - nOuterStateful;

  const kinds: Kind[] = [
    ...Array<Kind>(nOuterStateful).fill("outerStateful"),
    ...Array<Kind>(nOuterDeps).fill("outerDeps"),
    ...Array<Kind>(nBase).fill("base"),
    ...Array<Kind>(nShell).fill("shell"),
  ];
  // Deterministic Fisher-Yates shuffle so kinds interleave (cross-kind deps).
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = prng.int(0, i);
    [kinds[i], kinds[j]] = [kinds[j]!, kinds[i]!];
  }

  const specs: ResSpec[] = [];
  for (let index = 0; index < n; index++) {
    const kind = kinds[index]!;
    const prior = specs;

    if (kind === "shell") {
      const grp = index % 5;
      specs.push({
        index,
        kind,
        ns: `shell/grp${grp}/s${index}`,
        typeName: `Shell_Grp${grp}_S${index}`,
        importPath: `shell/grp${grp}/s${index}/en`,
        depth: 3,
        varName: `s${index}`,
        deps: [],
        depMode: "list",
        refMode: "string",
        width: prng.int(4, 8),
        useDefine: prng.chance(0.5), // ~half use Shell.define((plugin) => …)
      });
      continue;
    }

    if (kind === "outerStateful") {
      specs.push(makeGearSpec(index, "outerStateful", [], prng));
      continue;
    }

    if (kind === "outerDeps") {
      // OuterGear deps may target earlier outer OR base gears.
      const pool = prior.filter((s) => s.kind === "outerStateful" || s.kind === "outerDeps" || s.kind === "base");
      if (pool.length === 0) {
        // No compatible dep yet — emit a stateful leaf instead.
        specs.push(makeGearSpec(index, "outerStateful", [], prng));
        continue;
      }
      const deps = prng.sample(pool, prng.int(1, 3));
      specs.push(makeGearSpec(index, "outerDeps", deps, prng));
      continue;
    }

    // kind === "base": BaseGear deps may target earlier base gears only.
    const basePool = prior.filter((s) => s.kind === "base");
    const deps = basePool.length ? prng.sample(basePool, prng.int(1, 2)) : [];
    specs.push(makeGearSpec(index, "base", deps, prng));
  }

  // One shell(mono) Intl formatter, registered as the `fmt` shellKit member that
  // the Shell.define shells consume. Infrastructure resource (atlas size = n + 1).
  specs.push({
    index: n,
    kind: "fmt",
    ns: "shell/lib/fmt",
    typeName: "Shell_Lib_Fmt",
    importPath: "shell/lib/fmt",
    depth: 2,
    varName: "fmt",
    deps: [],
    depMode: "list",
    refMode: "string",
    width: 0,
    useDefine: true,
  });

  return specs;
}

function makeGearSpec(index: number, kind: Kind, deps: ResSpec[], prng: Prng): ResSpec {
  const isBase = kind === "base";
  const internal = isBase && prng.chance(0.05);
  const base = isBase ? `base/b${index}` : `outer/g${index}`;
  return {
    index,
    kind,
    // Internal-namespace marker `#` is a PREFIX (first char), e.g. `#base/b3`.
    ns: internal ? `#${base}` : base,
    typeName: isBase ? `Base_B${index}` : `Outer_G${index}`,
    importPath: base,
    depth: 1,
    varName: isBase ? `b${index}` : `g${index}`,
    deps,
    depMode: deps.length ? prng.pick(["list", "map"] as const) : "list",
    refMode: deps.length ? prng.pick(["string", "token"] as const) : "string",
    width: prng.int(4, 6),
    useDefine: false,
  };
}

function renderResource(spec: ResSpec): { path: string; content: string }[] {
  switch (spec.kind) {
    case "outerStateful":
      return [{ path: `${spec.importPath}.ts`, content: renderOuterStateful(spec) }];
    case "outerDeps":
      return [{ path: `${spec.importPath}.ts`, content: renderOuterDeps(spec) }];
    case "base":
      return [{ path: `${spec.importPath}.ts`, content: renderBase(spec) }];
    case "fmt":
      return [{ path: `${spec.importPath}.ts`, content: renderFmtShell(spec) }];
    case "shell": {
      const dir = `shell/grp${spec.index % 5}/s${spec.index}`;
      const render = spec.useDefine ? renderShellDefineVariant : renderShellVariant;
      return [
        { path: `${dir}/en.tsx`, content: render(spec, "en") },
        { path: `${dir}/it.tsx`, content: render(spec, "it") },
      ];
    }
  }
}

export interface GeneratedProject {
  n: number;
  dir: string;
  srcDir: string;
  fixturePath: string;
  tsconfigPath: string;
  compileTsconfigPath: string;
  fileCount: number;
}

export function generateProject(n: number): GeneratedProject {
  const dir = projectDir(n);
  rmSync(dir, { recursive: true, force: true });
  const srcDir = resolve(dir, "src");
  mkdirSync(srcDir, { recursive: true });

  const prng = new Prng(SEED ^ n);
  const specs = plan(n, prng);

  let fileCount = 0;
  const write = (relFromSrc: string, content: string) => {
    const abs = resolve(srcDir, relFromSrc);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
    fileCount++;
  };

  for (const spec of specs) {
    for (const file of renderResource(spec)) {
      write(file.path, file.content);
    }
  }

  write("resource-atlas.ts", renderResourceAtlas(specs));
  write("tokens.ts", renderTokens(specs));
  write("setup.ts", renderSetup());
  write("toolset.ts", renderToolset());

  const anchors: FixtureAnchors = {
    outerNs: specs.find((s) => s.kind.startsWith("outer"))!.ns,
    shellNs: specs.find((s) => s.kind === "shell")!.ns,
  };
  write("_fixture.tsx", renderFixture(anchors));

  const tsconfigPath = resolve(dir, "tsconfig.json");
  writeFileSync(tsconfigPath, renderTsconfig());
  const compileTsconfigPath = resolve(dir, "tsconfig.compile.json");
  writeFileSync(compileTsconfigPath, renderCompileTsconfig());

  return {
    n,
    dir,
    srcDir,
    fixturePath: resolve(srcDir, "_fixture.tsx"),
    tsconfigPath,
    compileTsconfigPath,
    fileCount,
  };
}

// ─── CLI ────────────────────────────────────────────────────────────────────

function parseN(argv: string[]): number {
  const i = argv.indexOf("--n");
  const raw = i >= 0 ? argv[i + 1] : undefined;
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(n) || n < 4) {
    throw new Error("Usage: tsx src/generate.ts --n <count>=4..>");
  }
  return n;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const n = parseN(process.argv);
  const p = generateProject(n);
  console.log(`Generated ${p.fileCount} files for N=${n} at ${p.dir}`);
}
