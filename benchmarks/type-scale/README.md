# type-scale-bench

Type-system scalability benchmark for R-Machine. It generates **realistic
R-Machine projects of growing size** (10 → 500 resources) and measures three
things at each scale point:

1. **Compile cost** — `tsc --extendedDiagnostics` (types, instantiations, check time, memory).
2. **IntelliSense latency** — a live `tsserver` driven with completion + quickinfo
   requests at realistic cursor positions (the latency a developer actually feels).
3. **Type-trace hot spots** — `tsc --generateTrace` + `@typescript/analyze-trace`.

Results land in [results/REPORT.md](results/REPORT.md) (+ `results/results.json`).

## Run

```bash
pnpm bench:types                 # from the repo root: full run, all scale points
# or, inside this package:
pnpm run-all                     # full run
pnpm generate --n 250            # emit one project (generated/250/)
pnpm bench:compile --n 250       # compile metrics for one N
pnpm bench:intellisense --n 250  # tsserver latencies for one N
pnpm bench:trace --n 250         # trace hot spots for one N
```

## How it works

- `src/generate.ts` + `src/templates.ts` — deterministic generator (seeded PRNG,
  so the same N always produces the identical project). Distribution: ~50%
  OuterGear / 20% BaseGear / 30% Shell, acyclic deps in a mix of **list and map**
  modes with **string and token** references, plus a few `#`-internal base gears.
- Each project type-checks against the library **sources** (`@r-machine/source`
  condition, `moduleResolution: bundler`) — i.e. the exact generics a user sees
  in their editor, not the built `.d.ts`.
- Each project carries a `src/_fixture.tsx` with sentinel-commented probe sites
  the tsserver driver targets. Its completion probes use empty strings (`""`) to
  force the full candidate union, so they are excluded from `tsconfig.compile.json`
  (the clean compile-metrics gate) but kept in the main `tsconfig.json` that
  tsserver loads.

`generated/` is git-ignored and recreated on demand; `results/` is committed as a
history for regression tracking. Numbers are machine-specific — read the trends.
