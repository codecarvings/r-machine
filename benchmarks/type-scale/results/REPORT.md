# R-Machine — Type-System Scalability Report

_Generated 2026-09-07T20:16:31.462Z. Deterministic: same seed+N => identical project. Re-run `pnpm run-all` to reproduce._

This report measures how R-Machine's TypeScript generics behave as the number of
**resources** (OuterGear / BaseGear / Shell) grows from 10 to
500. Projects are synthetic but realistic:
~50% OuterGear / 20% BaseGear / 30% Shell, acyclic dependencies in a mix of
list/map modes with string and token references. Numbers are machine-specific —
read the **trends**, not the absolutes.

## 1. Compile cost (`tsc --extendedDiagnostics`)

| N | Types | Instantiations | Inst/resource | Check (s) | Total (s) | Mem (MB) | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 40,592 | 135,846 | 13,585 | 0.39 | 0.57 | 143 | 0 |
| 25 | 42,514 | 150,117 | 6,005 | 0.43 | 0.61 | 145 | 0 |
| 50 | 45,176 | 171,542 | 3,431 | 0.47 | 0.65 | 161 | 0 |
| 100 | 50,798 | 218,999 | 2,190 | 0.56 | 0.75 | 220 | 0 |
| 250 | 66,750 | 383,842 | 1,535 | 0.89 | 1.11 | 245 | 0 |
| 500 | 93,679 | 747,740 | 1,495 | 1.45 | 1.74 | 326 | 0 |

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
| 10 | 414 | 8.6 | 9.1 | 2.1 | 21.7 | 75.5 | 1.5 |
| 25 | 417 | 12.3 | 11.9 | 2.9 | 23.8 | 75.5 | 1.2 |
| 50 | 471 | 16.3 | 18 | 2.9 | 28.6 | 80.2 | 1.2 |
| 100 | 459 | 23.7 | 26.7 | 3.8 | 34.7 | 91.1 | 1.2 |
| 250 | 553 | 45.2 | 52.5 | 6.5 | 58.4 | 112.7 | 1.7 |
| 500 | 646 | 83.1 | 95.8 | 10.8 | 96.5 | 153.5 | 2.3 |

**p95 (ms)**

| N | Project load (ms) | deps_list | deps_map | token | surface | plug | hover |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 414 | 13.7 | 16.4 | 4.8 | 23.6 | 77.2 | 5 |
| 25 | 417 | 26.8 | 15.5 | 9.3 | 29.7 | 89 | 5.2 |
| 50 | 471 | 17.3 | 20.6 | 5 | 30.3 | 97 | 4.6 |
| 100 | 459 | 26.4 | 28.7 | 5.7 | 39.5 | 113.6 | 4.5 |
| 250 | 553 | 49.2 | 55.6 | 7.9 | 62 | 126 | 4.5 |
| 500 | 646 | 88.1 | 98.4 | 11.6 | 100.1 | 190 | 4.2 |

## 3. Type-trace hot spots (`@typescript/analyze-trace`)

### N=250

```
Hot Spots
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine/packages/r-machine/src/core/outer-gear-composer.ts (51ms)
└─ Check file /users/sergio/repos/own/r-machine.project/r-machine/benchmarks/type-scale/generated/250/src/setup.ts (47ms)
   └─ Check variable declaration from (line 8, char 7) to (line 14, char 3) (45ms)
      └─ Check expression from (line 8, char 18) to (line 14, char 3) (45ms)
         └─ Compare types 37555 and 28098 (38ms)
            └─ Compare types 37555 and 28096 (34ms)
               └─ Compare types 37556 and 1253 (34ms)
                  ├─ {"id":37556,"kind":"Object","name":"ResourceAtlas","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine/benchmarks/type-scale/generated/250/src/resource-atlas.ts","line":517,"char":1}}
                  └─ {"id":1253,"kind":"Object","name":"AnyResAtlas","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine/packages/r-machine/src/core/res-atlas.ts","line":62,"char":1}}

No duplicate packages found
```

### N=500

```
Hot Spots
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine/benchmarks/type-scale/generated/500/src/setup.ts (95ms)
│  └─ Check variable declaration from (line 8, char 7) to (line 14, char 3) (90ms)
│     └─ Check expression from (line 8, char 18) to (line 14, char 3) (90ms)
│        └─ Compare types 37555 and 28098 (79ms)
│           └─ Compare types 37555 and 28096 (70ms)
│              └─ Compare types 37556 and 1253 (70ms)
│                 └─ Compare types 38644 and 1261 (40ms)
│                    ├─ {"id":38644,"kind":"GenericTypeAlias","name":"ShapeMap","aliasTypeArguments":[37598,37607,721],"location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine/packages/r-machine/src/core/res-atlas.ts","line":12,"char":1}}
│                    │  ├─ {"id":37598,"kind":"AnonymousObject","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine/benchmarks/type-scale/generated/500/src/resource-atlas.ts","line":506,"char":30}}
│                    │  ├─ {"id":37607,"kind":"Object","name":"ResourceMap","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine/benchmarks/type-scale/generated/500/src/resource-atlas.ts","line":513,"char":1}}
│                    │  └─ {"id":721,"kind":"StringLiteral","value":"\"gear:base\""}
│                    └─ {"id":1261,"kind":"Object","name":"AnyResDomain","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine/packages/r-machine/src/core/res-domain.ts","line":15,"char":1}}
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine/packages/r-machine/src/core/outer-gear-composer.ts (52ms)
└─ Check file /users/sergio/repos/own/r-machine.project/r-machine/packages/r-machine/src/lib/r-machine.ts (26ms)
   └─ Compare types 30260 and 30249 (18ms)
      └─ Determine variance of type 30000 (18ms)
         └─ Compare types 31757 and 31756 (11ms)
            └─ Compare types 31761 and 31760 (11ms)
               └─ Compare types 31765 and 31763 (11ms)
                  └─ Compare types 31765 and 31762 (11ms)
                     └─ Compare types 31764 and 31762 (11ms)
                        ├─ {"id":31764,"kind":"AnonymousType","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine/packages/r-machine/src/lib/r-machine-toolset.ts","line":29,"char":5}}
                        └─ {"id":31762,"kind":"AnonymousType","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine/packages/r-machine/src/lib/r-machine-toolset.ts","line":29,"char":5}}

No duplicate packages found
```

## 4. Observations

From N=10 to N=500 (a **50×** resource increase):

- **Instantiations** grew **5.5×** (135,846 → 747,740). Per-resource instantiations went 13,585 → 1,495 (sub-linear ×0.11 — amortizes well).
- **Check time** 0.39s → 1.45s.
- **Consumer Plug completion p95** (`Plug("|")`) 77.2ms → 190.0ms (**2.5×**) — the IntelliSense path a developer feels most.
