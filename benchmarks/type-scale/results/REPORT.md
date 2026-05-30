# R-Machine — Type-System Scalability Report

_Generated 2026-05-30T13:45:45.795Z. Deterministic: same seed+N => identical project. Re-run `pnpm run-all` to reproduce._

This report measures how R-Machine's TypeScript generics behave as the number of
**resources** (OuterGear / BaseGear / Shell) grows from 10 to
500. Projects are synthetic but realistic:
~50% OuterGear / 20% BaseGear / 30% Shell, acyclic dependencies in a mix of
list/map modes with string and token references. Numbers are machine-specific —
read the **trends**, not the absolutes.

## 1. Compile cost (`tsc --extendedDiagnostics`)

| N | Types | Instantiations | Inst/resource | Check (s) | Total (s) | Mem (MB) | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 37,260 | 123,224 | 12,322 | 0.36 | 0.53 | 163 | 0 |
| 25 | 38,996 | 135,744 | 5,430 | 0.39 | 0.57 | 158 | 0 |
| 50 | 41,290 | 154,672 | 3,093 | 0.42 | 0.6 | 176 | 0 |
| 100 | 46,231 | 196,916 | 1,969 | 0.5 | 0.69 | 174 | 0 |
| 250 | 60,199 | 347,057 | 1,388 | 0.75 | 0.96 | 232 | 0 |
| 500 | 83,830 | 685,859 | 1,372 | 1.28 | 1.53 | 333 | 0 |

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
| 10 | 404 | 8.2 | 8.5 | 2.1 | 15.2 | 66.8 | 1 |
| 25 | 405 | 10.7 | 10.5 | 2.4 | 18.7 | 69.6 | 1 |
| 50 | 417 | 14.4 | 15.8 | 2.9 | 22 | 71.5 | 1.6 |
| 100 | 458 | 21.2 | 24 | 3.8 | 29 | 81.1 | 1.4 |
| 250 | 549 | 41.4 | 46.1 | 6.5 | 51 | 101.7 | 1.8 |
| 500 | 639 | 74.5 | 84.3 | 11.4 | 86 | 141.8 | 2.6 |

**p95 (ms)**

| N | Project load (ms) | deps_list | deps_map | token | surface | plug | hover |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 404 | 12.7 | 12.9 | 4.3 | 21 | 71.5 | 4.5 |
| 25 | 405 | 24.7 | 13.6 | 5.8 | 24.2 | 82.3 | 1.2 |
| 50 | 417 | 17.8 | 40.3 | 4.9 | 27.6 | 74.3 | 15.5 |
| 100 | 458 | 25.5 | 25.6 | 5.8 | 31 | 117.1 | 5.1 |
| 250 | 549 | 47.7 | 50.1 | 7.9 | 52.9 | 123.3 | 1.8 |
| 500 | 639 | 79.9 | 87.6 | 12.4 | 89.9 | 169.8 | 5.2 |

## 3. Type-trace hot spots (`@typescript/analyze-trace`)

### N=250

```
Hot Spots
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/outer-gear-composer.ts (46ms)
└─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/250/src/setup.ts (44ms)
   └─ Check variable declaration from (line 8, char 7) to (line 17, char 3) (41ms)
      └─ Check expression from (line 8, char 18) to (line 17, char 3) (41ms)
         └─ Compare types 34390 and 3546 (36ms)
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
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/500/src/setup.ts (99ms)
│  └─ Check variable declaration from (line 8, char 7) to (line 17, char 3) (93ms)
│     └─ Check expression from (line 8, char 18) to (line 17, char 3) (93ms)
│        └─ Compare types 34390 and 3546 (80ms)
│           └─ Compare types 34390 and 3544 (65ms)
│              └─ Compare types 34391 and 719 (65ms)
│                 └─ Compare types 35478 and 775 (38ms)
│                    ├─ {"id":35478,"kind":"GenericTypeAlias","name":"ShapeMap","aliasTypeArguments":[34433,34442,1013],"location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/res-atlas.ts","line":6,"char":1}}
│                    │  ├─ {"id":34433,"kind":"AnonymousObject","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/500/src/resource-atlas.ts","line":506,"char":30}}
│                    │  ├─ {"id":34442,"kind":"Object","name":"ResourceMap","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/500/src/resource-atlas.ts","line":513,"char":1}}
│                    │  └─ {"id":1013,"kind":"StringLiteral","value":"\"gear:base\""}
│                    └─ {"id":775,"kind":"Object","name":"AnyResDomain","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/res-domain.ts","line":22,"char":1}}
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/outer-gear-composer.ts (49ms)
└─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/base-gear-composer.ts (27ms)

No duplicate packages found
```

## 4. Observations

From N=10 to N=500 (a **50×** resource increase):

- **Instantiations** grew **5.6×** (123,224 → 685,859). Per-resource instantiations went 12,322 → 1,372 (sub-linear ×0.11 — amortizes well).
- **Check time** 0.36s → 1.28s.
- **Consumer Plug completion p95** (`Plug("|")`) 71.5ms → 169.8ms (**2.4×**) — the IntelliSense path a developer feels most.
