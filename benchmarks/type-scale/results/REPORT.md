# R-Machine — Type-System Scalability Report

_Generated 2026-06-07T10:04:08.751Z. Deterministic: same seed+N => identical project. Re-run `pnpm run-all` to reproduce._

This report measures how R-Machine's TypeScript generics behave as the number of
**resources** (OuterGear / BaseGear / Shell) grows from 10 to
500. Projects are synthetic but realistic:
~50% OuterGear / 20% BaseGear / 30% Shell, acyclic dependencies in a mix of
list/map modes with string and token references. Numbers are machine-specific —
read the **trends**, not the absolutes.

## 1. Compile cost (`tsc --extendedDiagnostics`)

| N | Types | Instantiations | Inst/resource | Check (s) | Total (s) | Mem (MB) | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 37,675 | 124,047 | 12,405 | 0.37 | 0.55 | 166 | 0 |
| 25 | 39,576 | 137,487 | 5,499 | 0.39 | 0.57 | 163 | 0 |
| 50 | 42,175 | 157,875 | 3,158 | 0.43 | 0.61 | 179 | 0 |
| 100 | 47,693 | 203,152 | 2,032 | 0.54 | 0.73 | 176 | 0 |
| 250 | 63,340 | 361,501 | 1,446 | 0.85 | 1.07 | 200 | 0 |
| 500 | 89,769 | 714,690 | 1,429 | 1.4 | 1.67 | 294 | 0 |

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
| 10 | 398 | 7.9 | 8.2 | 2.1 | 18.1 | 65.6 | 0.9 |
| 25 | 403 | 11 | 10.6 | 2.4 | 22 | 69.1 | 1.6 |
| 50 | 426 | 14.2 | 15.3 | 3 | 24.2 | 72.1 | 1.7 |
| 100 | 641 | 23.5 | 23.6 | 3.7 | 31.4 | 79.8 | 1.3 |
| 250 | 537 | 41.9 | 46.6 | 6.4 | 52.9 | 104.5 | 1.8 |
| 500 | 648 | 74.5 | 83.4 | 11.6 | 87.9 | 136.7 | 2.5 |

**p95 (ms)**

| N | Project load (ms) | deps_list | deps_map | token | surface | plug | hover |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 398 | 13.1 | 12.9 | 5.8 | 23.2 | 70 | 1 |
| 25 | 403 | 22.3 | 14.3 | 5 | 25.3 | 73.2 | 7.2 |
| 50 | 426 | 18.2 | 16.5 | 5.2 | 27 | 74.4 | 15.4 |
| 100 | 641 | 26.9 | 25.3 | 5.4 | 34.5 | 90.9 | 4.9 |
| 250 | 537 | 47.2 | 54.8 | 7.7 | 55.5 | 145.5 | 1.9 |
| 500 | 648 | 78.5 | 86.7 | 12.4 | 92.8 | 165.9 | 5 |

## 3. Type-trace hot spots (`@typescript/analyze-trace`)

### N=250

```
Hot Spots
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/outer-gear-composer.ts (49ms)
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/250/src/setup.ts (45ms)
│  └─ Check variable declaration from (line 8, char 7) to (line 17, char 3) (42ms)
│     └─ Check expression from (line 8, char 18) to (line 17, char 3) (42ms)
│        └─ Compare types 34675 and 26667 (37ms)
│           └─ Compare types 34675 and 26665 (33ms)
│              └─ Compare types 34676 and 1461 (33ms)
│                 └─ Compare types 35263 and 1519 (21ms)
│                    ├─ {"id":35263,"kind":"GenericTypeAlias","name":"ShapeMap","aliasTypeArguments":[34718,34727,777],"location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/res-atlas.ts","line":6,"char":1}}
│                    │  ├─ {"id":34718,"kind":"AnonymousObject","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/250/src/resource-atlas.ts","line":256,"char":30}}
│                    │  ├─ {"id":34727,"kind":"Object","name":"ResourceMap","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/250/src/resource-atlas.ts","line":263,"char":1}}
│                    │  └─ {"id":777,"kind":"StringLiteral","value":"\"gear:base\""}
│                    └─ {"id":1519,"kind":"Object","name":"AnyResDomain","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/res-domain.ts","line":22,"char":1}}
└─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/base-gear-composer.ts (28ms)

No duplicate packages found
```

### N=500

```
Hot Spots
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/500/src/setup.ts (86ms)
│  └─ Check variable declaration from (line 8, char 7) to (line 17, char 3) (81ms)
│     └─ Check expression from (line 8, char 18) to (line 17, char 3) (81ms)
│        └─ Compare types 34675 and 26667 (72ms)
│           └─ Compare types 34675 and 26665 (65ms)
│              └─ Compare types 34676 and 1461 (65ms)
│                 └─ Compare types 35763 and 1519 (37ms)
│                    ├─ {"id":35763,"kind":"GenericTypeAlias","name":"ShapeMap","aliasTypeArguments":[34718,34727,777],"location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/res-atlas.ts","line":6,"char":1}}
│                    │  ├─ {"id":34718,"kind":"AnonymousObject","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/500/src/resource-atlas.ts","line":506,"char":30}}
│                    │  ├─ {"id":34727,"kind":"Object","name":"ResourceMap","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/benchmarks/type-scale/generated/500/src/resource-atlas.ts","line":513,"char":1}}
│                    │  └─ {"id":777,"kind":"StringLiteral","value":"\"gear:base\""}
│                    └─ {"id":1519,"kind":"Object","name":"AnyResDomain","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/res-domain.ts","line":22,"char":1}}
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/outer-gear-composer.ts (49ms)
├─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/core/base-gear-composer.ts (28ms)
└─ Check file /users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine.ts (27ms)
   └─ Compare types 28156 and 28145 (22ms)
      └─ Determine variance of type 27948 (22ms)
         └─ Compare types 28886 and 28885 (18ms)
            └─ Compare types 28892 and 28891 (18ms)
               └─ Compare types 28898 and 28895 (18ms)
                  ├─ {"id":28898,"kind":"AliasedIntersection","name":"RMachineToolset","aliasTypeArguments":[27943,27944,47,27947],"count":2,"types":[28896,28897],"location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine-toolset.ts","line":29,"char":1}}
                  │  ├─ {"id":27943,"kind":"TypeParameter","name":"RA","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine.ts","line":77,"char":3}}
                  │  ├─ {"id":27944,"kind":"TypeParameter","name":"L","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine.ts","line":78,"char":3}}
                  │  ├─ {"id":47,"kind":"TypeParameter"}
                  │  ├─ {"id":27947,"kind":"TypeParameter","name":"EF","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine.ts","line":80,"char":3}}
                  │  ├─ {"id":28896,"kind":"AnonymousType","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine-toolset.ts","line":34,"char":5}}
                  │  └─ {"id":28897,"kind":"ConditionalType","conditionalCheckType":28025,"conditionalExtendsType":8105,"conditionalTrueType":28899,"conditionalFalseType":38}
                  │     ├─ {"id":28025,"kind":"IndexedAccess","indexedAccessObjectType":27947,"indexedAccessIndexType":27902}
                  │     │  ├─ {"id":27947,"kind":"TypeParameter","name":"EF","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine.ts","line":80,"char":3}}
                  │     │  └─ {"id":27902,"kind":"StringLiteral","value":"\"outerGear\""}
                  │     ├─ {"id":8105,"kind":"StringLiteral","value":"\"on\""}
                  │     ├─ {"id":28899,"kind":"AnonymousType","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine-toolset.ts","line":40,"char":5}}
                  │     └─ {"id":38,"kind":"AnonymousType","display":"{}"}
                  └─ {"id":28895,"kind":"AliasedIntersection","name":"RMachineToolset","aliasTypeArguments":[27943,27944,46,27947],"count":2,"types":[28893,28894],"location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine-toolset.ts","line":29,"char":1}}
                     ├─ {"id":27943,"kind":"TypeParameter","name":"RA","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine.ts","line":77,"char":3}}
                     ├─ {"id":27944,"kind":"TypeParameter","name":"L","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine.ts","line":78,"char":3}}
                     ├─ {"id":46,"kind":"TypeParameter"}
                     ├─ {"id":27947,"kind":"TypeParameter","name":"EF","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine.ts","line":80,"char":3}}
                     ├─ {"id":28893,"kind":"AnonymousType","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine-toolset.ts","line":34,"char":5}}
                     └─ {"id":28894,"kind":"ConditionalType","conditionalCheckType":28025,"conditionalExtendsType":8105,"conditionalTrueType":28901,"conditionalFalseType":38}
                        ├─ {"id":28025,"kind":"IndexedAccess","indexedAccessObjectType":27947,"indexedAccessIndexType":27902}
                        │  ├─ {"id":27947,"kind":"TypeParameter","name":"EF","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine.ts","line":80,"char":3}}
                        │  └─ {"id":27902,"kind":"StringLiteral","value":"\"outerGear\""}
                        ├─ {"id":8105,"kind":"StringLiteral","value":"\"on\""}
                        ├─ {"id":28901,"kind":"AnonymousType","location":{"path":"/users/sergio/repos/own/r-machine.project/r-machine.worktrees/rm-alpha-12/packages/r-machine/src/lib/r-machine-toolset.ts","line":40,"char":5}}
                        └─ {"id":38,"kind":"AnonymousType","display":"{}"}

No duplicate packages found
```

## 4. Observations

From N=10 to N=500 (a **50×** resource increase):

- **Instantiations** grew **5.8×** (124,047 → 714,690). Per-resource instantiations went 12,405 → 1,429 (sub-linear ×0.12 — amortizes well).
- **Check time** 0.37s → 1.4s.
- **Consumer Plug completion p95** (`Plug("|")`) 70.0ms → 165.9ms (**2.4×**) — the IntelliSense path a developer feels most.
