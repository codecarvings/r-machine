# R-Machine — Type-System Scalability Report

_Generated 2026-05-30T09:33:25.263Z. Deterministic: same seed+N => identical project. Re-run `pnpm run-all` to reproduce._

This report measures how R-Machine's TypeScript generics behave as the number of
**resources** (OuterGear / BaseGear / Shell) grows from 10 to
500. Projects are synthetic but realistic:
~50% OuterGear / 20% BaseGear / 30% Shell, acyclic dependencies in a mix of
list/map modes with string and token references. Numbers are machine-specific —
read the **trends**, not the absolutes.

## 1. Compile cost (`tsc --extendedDiagnostics`)

| N | Types | Instantiations | Inst/resource | Check (s) | Total (s) | Mem (MB) | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 37,259 | 123,224 | 12,322 | 0.44 | 0.62 | 162 | 0 |
| 25 | 38,995 | 135,744 | 5,430 | 0.39 | 0.57 | 158 | 0 |
| 50 | 41,289 | 154,672 | 3,093 | 0.42 | 0.59 | 175 | 0 |
| 100 | 46,230 | 196,916 | 1,969 | 0.51 | 0.73 | 167 | 0 |
| 250 | 60,198 | 347,057 | 1,388 | 0.77 | 1.01 | 228 | 0 |
| 500 | 83,829 | 685,859 | 1,372 | 1.38 | 1.64 | 284 | 0 |

> `Inst/resource` is the key non-linearity signal: flat ⇒ scales linearly,
> rising ⇒ the type system does super-linear work per added resource.

## 2. IntelliSense latency (live `tsserver`)

Each cell is the warm per-keystroke recompute latency (cache busted every sample)
at a realistic cursor position. `deps_*` = atlas-key completion inside
`withDeps()`; `token` = `token("|")`; `surface` = member access on a dependency;
`plug` = consumer `Plug("|")` completion; `hover` = quickinfo.

**p50 (ms)**

| N | Project load (ms) | deps_list | deps_map | token | surface | plug | hover |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 403 | 8 | 8.7 | 2.9 | 15.8 | 71.1 | 0.9 |
| 25 | 403 | 10.6 | 10.9 | 2.5 | 17.9 | 68.7 | 1 |
| 50 | 417 | 14.7 | 15.5 | 2.9 | 22 | 71.7 | 1.6 |
| 100 | 445 | 20.8 | 24 | 4 | 29.2 | 89.2 | 1.4 |
| 250 | 528 | 42 | 46 | 6.8 | 49.9 | 100.8 | 1.8 |
| 500 | 646 | 79.1 | 85 | 11.1 | 85.6 | 140.6 | 2.6 |

**p95 (ms)**

| N | Project load (ms) | deps_list | deps_map | token | surface | plug | hover |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 403 | 12.7 | 13.5 | 6.7 | 26.7 | 100.9 | 5.1 |
| 25 | 403 | 16.5 | 13.3 | 5.2 | 25.4 | 109.4 | 4.4 |
| 50 | 417 | 18.3 | 16.9 | 5.1 | 23.9 | 73.8 | 15.5 |
| 100 | 445 | 25 | 24.9 | 5.8 | 31.1 | 140 | 5.9 |
| 250 | 528 | 46.4 | 49.4 | 8.3 | 54.1 | 115.9 | 1.9 |
| 500 | 646 | 111.1 | 88.3 | 11.7 | 89.6 | 169.6 | 5.3 |

## 3. Type-trace hot spots (`@typescript/analyze-trace`)

### N=250

```
Hot Spots
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/outer-gear-composer.ts (48ms)
└─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/250/src/setup.ts (45ms)
   └─ Check variable declaration from (line 8, char 7) to (line 17, char 3) (42ms)
      └─ Check expression from (line 8, char 18) to (line 17, char 3) (42ms)
         └─ Compare types 34390 and 3546 (37ms)
            └─ Compare types 34390 and 3544 (33ms)
               └─ Compare types 34391 and 719 (33ms)
                  └─ Compare types 34978 and 775 (21ms)
                     ├─ {"id":34978,"kind":"GenericTypeAlias","name":"ShapeMap","aliasTypeArguments":[34433,34442,1013],"location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/res-atlas.ts","line":6,"char":1}}
                     │  ├─ {"id":34433,"kind":"AnonymousObject","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/250/src/resource-atlas.ts","line":256,"char":30}}
                     │  ├─ {"id":34442,"kind":"Object","name":"ResourceMap","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/250/src/resource-atlas.ts","line":263,"char":1}}
                     │  └─ {"id":1013,"kind":"StringLiteral","value":"\"gear:base\""}
                     └─ {"id":775,"kind":"Object","name":"AnyResDomain","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/res-domain.ts","line":22,"char":1}}

No duplicate packages found
```

### N=500

```
Hot Spots
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/500/src/setup.ts (85ms)
│  └─ Check variable declaration from (line 8, char 7) to (line 17, char 3) (80ms)
│     └─ Check expression from (line 8, char 18) to (line 17, char 3) (80ms)
│        └─ Compare types 34390 and 3546 (71ms)
│           └─ Compare types 34390 and 3544 (62ms)
│              └─ Compare types 34391 and 719 (61ms)
│                 └─ Compare types 35478 and 775 (37ms)
│                    ├─ {"id":35478,"kind":"GenericTypeAlias","name":"ShapeMap","aliasTypeArguments":[34433,34442,1013],"location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/res-atlas.ts","line":6,"char":1}}
│                    │  ├─ {"id":34433,"kind":"AnonymousObject","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/500/src/resource-atlas.ts","line":506,"char":30}}
│                    │  ├─ {"id":34442,"kind":"Object","name":"ResourceMap","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/500/src/resource-atlas.ts","line":513,"char":1}}
│                    │  └─ {"id":1013,"kind":"StringLiteral","value":"\"gear:base\""}
│                    └─ {"id":775,"kind":"Object","name":"AnyResDomain","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/res-domain.ts","line":22,"char":1}}
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/outer-gear-composer.ts (47ms)
└─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/base-gear-composer.ts (30ms)

No duplicate packages found
```

## 4. Observations

From N=10 to N=500 (a **50×** resource increase):

- **Instantiations** grew **5.6×** (123,224 → 685,859). Per-resource instantiations went 12,322 → 1,372 (sub-linear ×0.11 — amortizes well).
- **Check time** 0.44s → 1.38s.
- **Consumer Plug completion p95** (`Plug("|")`) 100.9ms → 169.6ms (**1.7×**) — the IntelliSense path a developer feels most.
