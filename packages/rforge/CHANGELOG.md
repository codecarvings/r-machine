# rforge

## 1.0.0-beta.0

### Patch Changes

- a1bc217: Loosen the inter-package peer ranges, declare a supported Node range, and stop shipping coverage artifacts.

  **Peer ranges.** The R-Machine packages declared each other with `workspace:*`, which pnpm rewrites to an **exact** version at publish time — `@r-machine/react@1.0.0-alpha.15` required literally `r-machine@1.0.0-alpha.15`. Any drift between two installed R-Machine packages was therefore an `ERESOLVE` failure rather than a warning. They now use `workspace:^`, published as `^1.0.0-<version>`, which accepts later releases of the same line and the eventual stable `1.0.0`. The packages still version and publish in lockstep, so a matched set remains the expected install.

  **`engines`.** All five packages now declare `"node": ">=20.9.0"`. This is the floor the codebase already assumed rather than a new restriction: `Symbol.dispose` (the resource-teardown convention) needs Node 20.4+, and `@r-machine/next` targets a Next.js version that itself requires 20.9+. Node 18 is end-of-life.

  **Packaging.** The `files` globs (`**/*.js`, `**/*.d.ts`, …) matched anything anywhere in the package directory, so a local coverage run leaked `coverage/*.js` into the tarball. `files` now excludes `**/coverage/**`.

- a1bc217: Relicense every R-Machine package from AGPL-3.0-only to Apache-2.0.

  R-Machine was published under the GNU Affero General Public License with a commercial exception: open source projects could use it freely, anything proprietary required a separate arrangement. That trade-off is now gone. All five packages — `r-machine`, `@r-machine/react`, `@r-machine/next`, `@r-machine/testing` and `rforge` — are licensed under the **Apache License, Version 2.0**, which permits use, modification and redistribution in any project, proprietary software included, and carries an express patent grant.

  Nothing is asked in return beyond what Apache-2.0 states: keep the copyright and licence notices, and note any significant changes you make to the files you redistribute.

  This is a one-way loosening — no permission previously granted is withdrawn. Versions published before this release remain available under the terms they shipped with; from this release forward the licence is Apache-2.0. The per-file notice is now a short SPDX header, and the commercial-licensing contact is retired.

- a1bc217: Write the R-Machine agent routing stanza once, in `AGENTS.md`, and point `CLAUDE.md` at it.

  Section A.5 of the bundled LLM Skill used to append the same stanza to **both** `CLAUDE.md` and `AGENTS.md`. It is now written only to `AGENTS.md` — the vendor-neutral file that Claude Code, Cursor, Codex and Copilot all read — while `CLAUDE.md` gets a bare `@AGENTS.md` line, which Claude Code resolves by inlining the target. One copy, wider reach, nothing to keep in sync.

  Three failure modes the old wording allowed are now called out explicitly:

  - **Next.js managed block.** `next dev` rewrites everything between `<!-- BEGIN:nextjs-agent-rules -->` and `<!-- END:nextjs-agent-rules -->` whenever it detects an agent, so a stanza appended inside those markers is silently lost. A.5 now says to append after the closing marker.
  - **`@` imports are not resolved inside code fences or code spans**, so the line must be written bare.
  - **`CLAUDE.md` symlinked to `AGENTS.md`** is one file, not two; writing both would duplicate the stanza.

  Section C.5 additionally offers to collapse a duplicated `CLAUDE.md` from a project set up by an older skill version.

- a1bc217: Stop the Skill from predicting blast-radius file counts, and document how a multi-locale shell evolves.

  `modify.md`'s worked example C ("add a pause button to the timer") reported _"Additive across 3 files"_ — the only numeric claim the Skill made about the property it sells, and wrong in the flattering direction. A multi-locale shell is one file per locale: `localized()` validates each variant against the canonical type at exact keys in both directions, so adding two labels to `en.tsx` breaks the compile of every sibling. The real count is `2 + N` for N locales, not 3.

  The fix is not better arithmetic. The three worked reports differ in where their numbers come from: A states the file it just edited, B reads _"tsc flagged 2 consumers + 1 test"_ off the compiler, and only C had the agent **predict** a total. So `modify.md` now says to report what `tsc` named and never to predict a count — the kind of change is the agent's to state, the numbers are the compiler's. That removes the whole class of error instead of correcting one instance, and keeps the finding that was actually convincing.

  Separately — and independent of any reporting — the Skill never said that a new shell member must be added to **every** locale file. An agent that added it only to the canonical one left the project not compiling, with nothing in the docs pointing at the variants. `patterns/shell.md` gains an "Evolving a multi-locale shell" section: the walk (canonical first, it owns the type, then each variant `tsc` names), the verbatim TS2345 error as the work list, and the fact that no partial-variant or fallback mode exists by design, so a half-translated shell cannot reach production.

  Verified against `examples/next`: adding two members to the canonical `shell/cart` produced exactly the documented error on the `it` variant.

- a1bc217: Correct and unify how the bundled R-Machine LLM Skill explains dependency declaration.

  The Skill framed `withDeps` and consumer plugs as two different mechanisms, and left the consumer as an implicit "reads families together" — which let an LLM treat plugs as unconstrained glass. In reality it is **one** declaration mechanism (list or map of namespaces) whose allowed families are keyed on the declaring site, and each consumer plug is pinned by the compiler to its own catalog (`res-atlas.ts`): `DirectPlug` → base + shell; `ServerPlug` → inner + base + shell; `Plug`/`ClientPlug` → base + outer + vertex + shell. `dep-asymmetry.md` now carries both matrices (resource→resource and consumer→resource) with the core / server-half / client-half framing, and `plug.md` / `client-plug.md` / `server-plug.md` each state their plug's allowed families explicitly (e.g. a `ClientPlug` cannot reach a server-only `inner/` gear).

- a1bc217: Bring the bundled R-Machine LLM Skill's generated Vite/Vitest configs in line with ESM-only config loading.

  Vite's `configLoader: 'native'` (a planned future default) runs config files as real ESM, so the Skill now generates configs that hold up under it. Two changes:

  - **`"type": "module"` is now checked before generating `vitest.config.ts`** (`testing.md`, with a pointer from `next-setup.md` §0). Every config the Skill emits is ESM, but `create-next-app` does not set the field — so a Next project would load its `vitest.config.ts` as CommonJS. `create-vite` already sets it, which is why only the Next path was silently affected. The note also covers the CJS escape hatch (`vitest.config.mts`).
  - **`path.resolve(import.meta.dirname, "src")` replaces `fileURLToPath(new URL("./src", import.meta.url))`** in every `vite.config.ts` / `vitest.config.ts` snippet (`react-setup.md`, `testing.md`), matching the repo's own examples, and `vite.config.ts` now carries an explicit "never the CJS `__dirname`" comment.

- a1bc217: Move the one-shot setup procedure out of `SKILL.md` into `references/setup.md`.

  Section A (initial project setup) was the last cold-path section still inlined in `SKILL.md`: 130 lines / ~5.9 KB that loaded on **every** skill invocation, for a procedure that runs **once per project**. Sections C and D were already thin routers into `references/`, and the per-framework setup detail already lived in `references/{next,react,standalone}-setup.md` — only the orchestration was still inline.

  `SKILL.md` drops from 532 to 406 lines (26.3 KB → 20.6 KB, −23%), so the common paths — add a resource (B), implement a feature (C), modify (D) — no longer carry the setup instructions. Step 0 routes to the new file instead, and the cross-references in `testing.md` and `next-setup.md` point at it.

  Section B stays inline deliberately: it is the hot path, and moving it would add a file read to the most frequent operation.

- a1bc217: Fix what the Skill says happens when `@r-machine/testing` and `r-machine` resolve to two module instances.

  The gotcha claimed that without `server: { deps: { inline: … } }` the mocks "silently do nothing" — green tests verifying nothing. That is no longer true: `mockPlug` reads the plug's head symbol at entry and throws `ERR_MOCK_TARGET_INVALID` when it is missing, which is exactly the two-instance condition. The failure is loud, immediate, and hits **every** `mockPlug` call in the suite.

  The real defect was the diagnosis, and it was broken in both directions. The Skill named `ERR_MOCK_TARGET_INVALID` in four places and attributed it to two causes — a plain-object resource, or a consumer missing its `Fn.plug` line — never to the module-instance split, which raises the same error. So an agent hitting it would search the Skill, find "you forgot `.plug`", and go re-add a line that was already there. Meanwhile the `deps.inline` bullet described a symptom nobody would ever observe.

  `testing.md` now states the actual symptom (every mock failing at once, with a message about the target, is a config problem rather than a target problem) and adds a three-cause triage for `ERR_MOCK_TARGET_INVALID` ordered by how it presents: all mocks failing → module instances; one resource → plain object, no plug; one consumer → missing `.plug`. The generated vitest config comment names the error too, so the line is not removed as boilerplate.

  The underlying cause — plug internals hanging off module-local `Symbol()` rather than `Symbol.for()` — is left alone deliberately; making `deps.inline` unnecessary is a design decision for a future version, not a docs fix.

- a1bc217: Fix the canonical timer example and document relay semantics exhaustively.

  `decompose.md`'s timer gear put `setInterval` inside `_.action` and tracked the handle in a closure variable — violating the placement rubric 55 lines above it in the same file (_"a side effect that fires when state changes → `_.relay` inside the owning outer gear"_). `_.action` is typed as a synchronous reducer returning `DeepPartial<S>`, so a side-effecting body still typechecks and nothing warns you; the effect then fires on the **click** rather than on the **state**, and drifts the moment `running` changes by any other route. `examples/react`'s real timer gear never does this — it creates its interval in the factory body and uses `_.relay` for the derived value.

  The root cause was in `patterns/outer.md`, which presented a side-effecting action as **✅ correct** and generalised it: _"if an action needs to both perform a side effect AND update state, return the state partial directly"_. That block now keeps its (correct) `_.cmd`-scope rule, marks the side effect as ❌ with the reason it is invisible to the compiler, and states the actual law: an action never performs a side effect — effects belong in a relay keyed on the state, construction-time work in the factory body, teardown in `[Symbol.dispose]`.

  A relay-only rewrite would have shipped a subtler bug: **a relay does not fire on registration** ("react to changes, not to existence"), so a gear whose state arrives already `running` — HMR restore, cassette, test seed — would never start its interval. Measured: display stays `0:00`. The corrected example therefore syncs the initial state explicitly, then registers the relay, and keeps `[Symbol.dispose]` because a relay has no teardown of its own.

  `patterns/outer.md` gains a "Relay semantics" section covering what is not guessable and was undocumented: no fire on registration; the `equals` strategies (`identity` default, `shallow`, custom) and that `true` suppresses the call; `onChange` returning `void | Cmd | Cmd[]`; cmds dispatched only after every dirty relay has fired, so all relays see one consistent world state; async `onChange` landing its cmds in a **separate** flush; no teardown; the 3-fire `RelayLoopError` + `relay:loopDetected`; errors contained and emitted as `relay:onChangeError`; the real firing order (depth from the mutating namespace → ResourceAtlas priority → registration order, _not_ registration order alone); and live-member test overrides via a `$`-prefixed member. Plus a table of which code belongs in which primitive.

  The corrected example was extracted verbatim from the doc, compiled, and run in `examples/react`: idle does not tick, `start()` ticks, `stop()` stops, restart resumes without double-ticking.

  Related, and the reason the action rule needed stating twice: `outer.md` described an action's return as a shallow `Partial<State>`, while the type is `DeepPartial<S>`. It now says so, and a new "Action return semantics" section documents the merge — write only the leaf you change and siblings survive — plus the four rules that are not guessable from the type: only plain objects merge (arrays, `Date`, `Map`, `Set`, class instances **replace** wholesale, so there is no element-wise array merge); a key set to `undefined` is **skipped**, so an action cannot clear a field that way and nothing warns you (model it as `T | null` and return `null`, which does replace); a fragment that changes nothing returns the **same** state reference, so an idempotent action wakes no subscriber; and the reducer stays pure and synchronous. All four measured against `examples/react`.

- a1bc217: Teach the Skill `useUnboundR` and the one-plug-per-function rule.

  `useUnboundR` appeared nowhere in the Skill, and `server-plug.md` modelled the render tree as a **dichotomy** — "entry point (receives `params`)" vs "nested (no `params`)" — while explicitly adding that passing `params` around still works. `generateMetadata` receives `params`, so it fell mechanically into the entry-point bucket and got `useR(params)`, silently binding the locale from a function that owns no render tree. The failure was not a rule being ignored; it was a correct application of an incomplete rule.

  `server-plug.md` now carries a **three call site** table keyed on a question rather than an enumeration of Next APIs — _does this function own the render tree for this request?_ — so an export the table does not list (`sitemap.ts`, `opengraph-image.tsx`, a future one) resolves by the criterion instead of pattern-matching to the nearest row. It states the real semantics (`useR` → `bindLocale`, writes the request context, `notFound()` on an invalid locale, `ERR_LOCALE_BIND_CONFLICT` on a divergent re-bind; `useUnboundR` → `getValidLocale`, validate-and-canonicalise only, throws), that `useUnboundR` always takes an argument, that `DirectPlug` has none, and the complete five-overload `ServerPlug` surface.

  The **one plug per function** rule is now written down in `server-plug.md` and `testing.md`: each consuming export declares its own plug and carries it as `Fn.plug`. `mockPlug` resolves a target through `.plug` and keys on that plug's identity, so a shared plug makes a page's metadata unmockable without the page — and mocking both throws `ERR_PLUG_ALREADY_MOCKED`. The carrier is whichever function calls the plug, not necessarily the default export.

  `next-features.md` gains "read without binding" beside bind/switch, and `SKILL.md` Step 4 a one-line rule. All of it documents what the five Next examples already do — `generateMetadata` (5/5) and `generateStaticParams` (4/4) have used `useUnboundR` with their own plug all along; only the Skill was behind. The `testing.md` mock example was verified by running it against `examples/next`.

- a1bc217: Skill: document the array/type asymmetry in the deep-partial merge law.

  The merge only descends into plain objects, so an array-valued key is written whole — but `DeepPartial<T[]>` distributes into the elements, which means an array of _partial_ elements typechecks while the runtime replaces the array with exactly that. State ends up violating its own type with no error from either side. This is the one place where the compiler does not back the model up, so the Skill now says so explicitly instead of leaving it to be inferred.

  ### Changed
  - `references/patterns/outer.md` — the "only plain objects merge" rule now spells out the type/runtime disagreement, with the `{ lines: [{ qty: 1 }] }` case that compiles and corrupts, and states that an array in an action fragment, a `ctrl.state` seed or a mock override is always a whole-array write.
  - `references/testing.md` — the resolution-override section now links the four merge rules in `outer.md` rather than only asserting "the same merge law", and the degradation note reads "any non-plain-object leaf" instead of "primitive leaves", which implied arrays merged element-wise. The `ctrl.state` seeding note gained the same caveat.

- a1bc217: Skill: document kit access on the consumer side.

  `$.kit.fmt.*` is used throughout the example apps — Next server components, Next client components, and the standalone renderer — but none of the consumer references documented it. `patterns/consume/client-plug.md` and `server-plug.md` never mentioned `$.kit` at all; `plug.md` deferred "kit access" to `patterns/plugin-context.md`; only `direct-plug.md` spelled it out. `plugin-context.md` in turn opens by saying both dep forms are accepted "on every consumer plug", but every code example in it is a `Shell.define` declaration site. A model reaching for the formatter from a component had to deduce `$.kit.fmt.number(...)` by analogy with a list-form shell and let `tsc` confirm the guess.

  The analogy happens to be exact, and now says so. `MapPlugin` / `ListPlugin` in `core/plug.ts` are shared by every plug and every declaration site: the map form spreads the kit as top-level keys (`Omit<KM, keyof DM>`), the list form does not, and `$.kit` works in both.

  - `plug.md`, `client-plug.md` and `server-plug.md` each gain a **Kit access** note, alongside the existing "Deps allowed" / "Which form" / "Localized links" notes, with the point that the declaration site differs per plug (`kit` / `clientKit` / `serverKit` on the strategy, `directKit` on `RMachine.create`) while the access path is `$.kit` for all of them.
  - `plugin-context.md` gains a consumer example — list form through `$.kit`, map form with the kit keys hoisted — so its "every consumer plug" claim is backed by code rather than by inference, plus the `Omit<KM, keyof DM>` consequence a reader would not guess: **a dep name shadows a kit key of the same name**, leaving the kit entry reachable only as `$.kit.<entry>`.

- a1bc217: Skill: make the list-form vs map-form dep declaration a decidable rule instead of a scattered rule of thumb.

  Both forms are accepted everywhere — every gear family, `Shell`, and every consumer plug — so the compiler never corrects a wrong choice. The Skill's only guidance was two passing remarks in two different pattern files ("map form for three or more deps (survives renames better)" in `outer.md`, "clearer beyond two deps" in `consume/plug.md`), neither of them in `SKILL.md` nor in `plugin-context.md` — the file `SKILL.md` names as the cross-cutting authority on the subject, and which covered only the _consequences_ of the form (plugin shape, kit access). No file under `references/patterns/consume/` linked to it at all.

  ### Changed
  - `references/patterns/plugin-context.md` — new "Choosing the form" section stating the rule (**up to 2 deps: list form; from 3 up: map form**, decided by counting), followed by "What follows from the choice": kit hoisting (a runtime error, not a type error, when confused), `mockPlug` override keys (by name in map form, by index in list form), and rename resilience.
  - `references/patterns/outer.md`, `references/patterns/consume/plug.md` — the two rules of thumb become pointers to that section, and their map-form examples grow to 3 deps (both previously demonstrated the map form with 2, contradicting the rule they stated).
  - `references/patterns/consume/client-plug.md`, `server-plug.md` — their "list/map form" notes now carry the threshold and link to `plugin-context.md`.
  - `SKILL.md` — the cross-cutting pointer states the rule inline, so the router sees it without loading the file.
  - `references/patterns/shell.md`, `references/concepts/dep-asymmetry.md`, `references/testing.md` — examples aligned to the rule; the `res.perLocale` dep in `dep-asymmetry.md` moves to the list form (`DepHandleList` accepts a `ShellResolverHandle`, so the threshold has no mechanical exception).

  Outside the package, `docs/llms-full.txt` §4.1 now states the same threshold as a **suggested convention** (the reference doc describes the API rather than instructing an implementer), and its §10.1 call-shape examples were rebalanced to illustrate it.

- a1bc217: Skill: explain the `_ctrl` convention, and surface the ESLint rule a stock Next scaffold needs.

  Several mock scopes bind a disposable they never read — `using _ctrl = mockPlug(...)`, where the binding exists only so `Symbol.dispose` runs at the end of the block. The skill already wrote `_ctrl` in exactly those places and plain `ctrl` where the value is used, but never said why, so the convention read as arbitrary. `references/testing.md` now states it: correct code that looks unused, given the `_` prefix so linters and readers both see the intent.

  On a freshly scaffolded `create-next-app`, that convention produces five `'_ctrl' is assigned a value but never used` warnings, because the stock config does not ignore `^_`. `references/setup.md` A.4 now covers it in the test-setup step, with the one `@typescript-eslint/no-unused-vars` option to add (`varsIgnorePattern`, and only that one — the args and caught-errors patterns cover constructs R-Machine never emits) — and instructs the model to **offer** it rather than write it, the same treatment as the `@/` alias: a lint config is project-wide policy the user may have curated, and in some projects a warning fails CI.

  This class of friction is invisible from inside the repo: the example apps use Biome and carry no ESLint config at all, so nothing here exercises the toolchain a real consumer gets from `create-next-app`.

- a1bc217: Skill: Next.js and React setups always create the formatter shell `shell/lib/fmt`, without asking.

  The references disagreed: `references/setup.md` listed the formatter as a question with "default yes", while `references/next-setup.md` and `references/react-setup.md` asked whether the project needed one. Agents resolved the conflict differently from run to run — some asked, some silently applied the default. A formatter is useful in every project and costs nothing to have, so it is no longer a question: setup.md A.2 and both framework references now say it is created by default, next to the empty `path-atlas.ts`.

  The opt-out branches are gone too — "No formatter? Drop the `fmt` import", the `// remove if not using a formatter shell` comments in every generated `setup.ts`, and the "or remove the `fmt` entries" alternative in the type-clean step, which now says to scaffold the formatter as the first resource and never to remove the kit entries to make `tsc` pass. The file checklists list `pub/shell/lib/fmt.ts`.

  Standalone is unchanged: `directKit` stays optional there.

- a1bc217: Skill: make the `_.getter` vs `_.cell` choice decidable instead of a judgement call.

  The two are interchangeable at the type level — both return `Getter<V>` — so a wrong choice is invisible to the compiler and to tests. The Skill's only guidance was a rule of thumb keyed on "a derived value **many components read**", which is a fact about the resource's future consumers: the agent writing the gear cannot evaluate it, so the choice fell back to judgement. The three criteria that _are_ answerable from the member body and the state shape were missing.

  ### Changed
  - `references/concepts/reactivity.md` — new "Choosing between them" section: `_.getter` is now stated as the explicit default (a subscribed cell is **eager** — it recomputes on every state change to decide whether to notify — and carries its own graph node), with `_.cell` gated on a closed list of three triggers (the body allocates; a non-trivial computation over a collection; the output stays `Object.is`-unchanged while the state changes often) and two cases where a cell is actively wrong (direct projection of a single-field state; an expensive allocating body, whose fresh reference means `Object.is` is never true and the cell never suppresses a notification).
  - `references/patterns/outer.md` — the `_.cell` section leads with the default/exception framing instead of "use it for derived values that many components read", and names why the cart example splits `lines` (getter) from `itemCount`/`subtotal` (cells).
  - `references/decompose.md` — the single "a value derived from state" row, which presented the two as interchangeable during decomposition, is split into a direct-projection row (`_.getter`) and a derived row (`_.cell`).

- a1bc217: Skill: give the setup interview fixed locale options, make clear the locale list can change at any time, and cover the single-locale project.

  `references/setup.md` now carries an **Asking for locales** section with three options, in order and none marked as recommended: **`en` only**, **`en` + `it`** (default `en`), and **Other** (the user types the codes, default first). Every answer is a complete, valid locale list, so a question tool with preset choices never ends without a code — earlier attempts to ask for locales openly left setups without a `setup.ts`. The question must also say that the choice is not permanent: locales can be added or removed later without touching gears or components.

  - **Add**: extend `locales`, add one sibling file per content shell. There is no fallback chain, so a missing `shell/<name>/<locale>` file is a resolve error, and the baseline `verifyResourceAtlas` test names every file still missing. The Next Origin strategy also needs a `localeOriginMap` entry, which is not typed against `locales` and otherwise fails only at runtime.
  - **Remove**: shrink `locales` (and `defaultLocale` if needed), delete the locale's files and its origin / path-atlas entries. Removing the canonical locale also means promoting a remaining sibling to the type-exporting form and repointing the `resource-atlas.ts` import.

  The per-framework references (`next-setup.md`, `react-setup.md`, `standalone-setup.md`) still asked for "Locales — e.g. `["en", "it"]`" on their own, contradicting that section; they now point at it. The Next Flat and Origin `setup.ts` templates also gain the `← replace with real locales` / `← replace with real default` markers the Path and React templates already had.

  For React, locale persistence (`localStorage`, cookie, none) is now presented as three equal choices. The references called `localStorage` the "default", and agents turned that into a "Recommended" option with no reason behind it.

  The test scaffolding question goes the other way: it is now marked as strongly recommended, with a one-line reason (typed `mockPlug` mocks fail to compile when a resource changes, and `verifyResourceAtlas` catches missing resource or locale files before runtime).

  Separately, the file-path rule said "for **multi-locale** shells the canonical file is `en.tsx`", which leaves a single-locale project to guess — and the plausible guess, `shell/product.tsx`, does not resolve. SKILL.md Step 3 and `references/patterns/shell.md` now state that a content shell is always a per-locale folder, single-locale projects included; `shell(mono)` remains the only single-file shell family.

- a1bc217: Skill: document the fourth kind of Mode D change — moving a resource to another family.

  `references/modify.md` classified a change three ways — implementation-only, additive, breaking — and all three describe a change to the **Surface**. Moving a resource between families (`outer/counter` → `vertex/counter`, the usual answer to "let this component appear several times on the page") is a fourth, orthogonal case: the Surface is identical and the resource's _address_ changes. It was not covered anywhere; `patterns/atlas-update.md` only adds and removes slots. A model asked to do it deduced the steps by hand.

  It is also the sharpest demonstration of Uniformity Under Change in the skill, because `outer` and `vertex` share a composer: the gear body is not touched at all. A new **Worked example D** documents it, including the parts that are not deducible from a successful run:

  - **Two blocking preconditions.** A vertex may not be a dep of any resource, and is not valid in a consumer `kit` / `clientKit`. Either one turns the move from a relocation into a refactor.
  - **A step `tsc` does not check.** The layout entry is compiler-verified through the atlas self-check, but the loader prefix registration is not — omitting it fails at runtime with `ERR_NO_LOADER_REGISTERED`, not at build time.
  - **A semantic change the compiler cannot see.** `gear:outer` is one shared instance per `(namespace, locale)`; `gear:outer(vertex)` is one per consumer. Pre-existing consumers that relied on shared state silently stop sharing — `<VertexFrame>` is the remedy when sharing was intended, and the skill now says to ask rather than assume.
  - **The cheapness does not generalise.** Only `outer` ↔ `vertex` leaves the body untouched; `base` ↔ `inner` swaps the composer and crosses the `pub/` / `prv/` fence, and `shell` ↔ `shell(mono)` converts between a per-locale folder and a single file.

  SKILL.md Section D gains the fourth classification and its report phrasing, and the Step 0 router lists a family move among the requests that reach Mode D.

- a1bc217: Disclose the `AGENTS.md` / `CLAUDE.md` routing-stanza write before making it, instead of after.

  Initial setup (Mode A) writes an R-Machine routing stanza into the project's agent instruction files — that stanza is what makes a later plain request ("add a timer") route back through the skill. It is a legitimate part of setup, but a user who did not expect those two files to change reads it as the skill editing files behind their back.

  ### Changed
  - **A.3** now announces the write alongside the generated files: which two files are touched, why, and that both writes are append-only. It is an opt-out point, not a gate — the skill states it and carries on, and skips A.5 only if the user objects. Turning it into a yes/no question is explicitly ruled out: at that moment the user cannot yet know what the stanza is for, and a "no" silently costs them the routing they just asked for.
  - **A.5** gains a reporting step: the two files are listed in the setup summary next to the generated ones, with the reason and the way out, plus whichever file was skipped and why.
  - **Section C step 5** (the retrofit fallback on an already-set-up project) is sharpened in the opposite direction: there the request was a feature, so touching agent instruction files is outside it — ask, and wait for a yes.

- a1bc217: Skill: state the test file's own path in every "Test it" snippet.

  The mirror rule (`src/<path>.ext` → `tests/<path>.test.ts(x)`) was stated in `references/testing.md` and in SKILL.md's Step 6, but nowhere in the pattern files — where the agent actually writes the test. Their source snippets all carry a `// src/…` header while the test snippets carried none, and the consumer ones imported the unit relatively (`./cart-button`, `./product-page`, `./render`), which reads as an instruction to colocate the test with its source.

  ### Changed
  - `references/patterns/{base,inner,outer,shell}.md` — each "Test it" snippet opens with its own `// tests/…` path; the two shell snippets also restate that a multi-locale shell gets one test named after the folder, not one per locale.
  - `references/patterns/vertex.md` — has no snippet, so the path is spelled out in prose.
  - `references/patterns/consume/{plug,server-plug,direct-plug}.md` — path header added and the relative import replaced with the `@/…` alias the test would actually use from `tests/`.

- a1bc217: Skill: document how a vertex gear is consumed — the case the family exists for.

  `references/patterns/vertex.md` showed how to _write_ a vertex gear and then compressed the whole consumer story into two reminder lines ("each `useR()` call creates its own instance"; "use `<VertexFrame>` to share"). The entire semantic of the family lives on the consumer side, and nothing else covered it: the `patterns/consume/*.md` files name `gear:outer(vertex)` only in their allowed-deps lists. A model implementing the canonical request — "let this component appear several times on the page" — had to open `vertex-frame.d.ts` in the installed package to confirm which way round it worked.

  The repo made that worse rather than better. The one vertex example in `examples/next` is the **sharing** case (`vertex/catalog-filter`, read and written by both the filter bar and the grid through a `VertexFrame`), so an agent verifying against the examples finds the exception, not the default.

  vertex.md now has two sections built from that example's real code shape:

  - **Consume it — several independent instances on one page.** The contrast with `gear:outer` (one shared instance per `(namespace, locale)`) stated outright, a two-sibling snippet, and the point that trips people: the `plug` const is module-level and shared by every render while the _instance_ is not, so independence needs no key, prop or wrapper.
  - **Share one instance — `<VertexFrame>`.** The opposite case, with the note that `gear` accepts one surface or an array, and that `VertexFrame` ships alongside the plug it pairs with (`createClientToolset()` in Next, `createToolset()` in React).

  Both carry the reason this deserves prose rather than a reminder line: getting it backwards **fails silently**. Two counters that wrongly share state are visually identical to two independent ones until someone clicks — no compile error, no warning — so the skill now also says to state which of the two you built when reporting. The remaining reminder folds in the consumer-kit restriction.

  Separately, `references/standalone-setup.md` pointed at `examples/standalone` as its "canonical working reference". The skill is installed into a consumer project, which has no `examples/` directory — the path sent the reading model after something that isn't there. It is now the public URL.

- a1bc217: Skill: tell webpack users why `next build --webpack` warns about top-level await.

  `client-toolset.ts` and `pub/loader.ts` are created with top-level await, and Next targets the client bundle at `["web", "es6"]` — ES2015 predates async/await, so webpack emits `EnvironmentNotSupportAsyncWarning` on both modules. The bundle is correct, but nothing in the Skill explained the warning or how to silence it.

  ### Changed
  - `references/next-setup.md` §2.3 — a note after the `client-toolset.ts` snippet: which two files warn, why, and the `next.config` webpack callback that drops the ES2015 constraint. It scopes the fix to the client compilation and says why the `isServer` branch must be left alone (already Node-targeted, and it also covers the edge compilation, which is not Node).

## 1.0.0-alpha.15

### Patch Changes

- 125f246: Add `res.perLocale` — declare a locale-keyed shell as a dependency of a locale-agnostic gear (or another shell).

  A gear has no ambient locale, so it cannot hold a shell as a plain resolved surface. `res.perLocale("shell/x")` (from the toolset) declares the shell as a dependency whose resolved value is a **loader** `(locale) => Promise<Surface>` the resource calls with a locale it receives at runtime — e.g. an `InnerGear` that renders a multilingual email in the recipient's locale. The `locale` parameter is typed to the atlas's configured locale union (an invalid locale is a compile error). It works in `withDeps` of any gear family, and inside a `Shell` (to reuse another locale's content on demand). The plain-dependency asymmetry is unchanged: a bare `shell/…` is still not a valid gear dependency — `res.perLocale` is the one sanctioned bridge, resolving to a loader rather than a surface.

  Two resolution-time batch helpers fold multiple loaders into a single call: `res.perLocale.pickAll(loader | map)` resolves every configured locale, locale-major (`Record<Locale, …>`); `res.perLocale.pick(locale, map | tuple)` resolves a batch at one locale, preserving map/tuple shape.

  `@r-machine/testing`: a `res.perLocale` dependency is mocked with a function `(locale) => partial`, deep-merged over the real localized surface (per call, per alias).

  `rforge`: the bundled Skill documents `res.perLocale` / `pickAll` / `pick`, and corrects the former "a shell can never be a dependency of a gear" guidance.

- 125f246: Install the R-Machine Skill into both `.claude/skills` and `.agents/skills`, and make re-runs version-aware.

  `rforge skill` now seeds both Claude Code's `.claude/skills` and the vendor-neutral `.agents/skills` on a first install, so the Skill is picked up regardless of which agent tool runs. Re-runs no longer refuse with a blunt "already exists": each installed Skill carries a `.rforge-skill.json` manifest whose content hash is compared against the bundled Skill, so a re-run reports **up to date** (nothing written) or offers an **update** when the bundled Skill actually changed.

  ### Changed
  - On a fresh install (no `--out`), copy the Skill into every location in `DEFAULT_TARGETS` (`.claude/skills` + `.agents/skills`). When the Skill is already present in some of those locations, update **only** the ones already present — a location the user removed is never resurrected. `--out <dir>` still targets exactly one directory, bypassing the multi-target policy.
  - Stamp each installed Skill with a `.rforge-skill.json` manifest (`skill`, `rforgeVersion`, `sourceHash`, `installedAt`). A re-run classifies each target as `absent` / `current` / `stale` from its recorded `sourceHash`: all current → up-to-date (no write); an available update → interactive confirm (default yes) in a TTY, or exit 1 with a `--force` hint when non-interactive. `--force` refreshes every resolved target unconditionally.

- 125f246: Extend the bundled R-Machine Skill from scaffolding-only to the full change lifecycle.

  The Skill previously spoke only creation ("set up r-machine", "add an OuterGear"). It now covers how R-Machine projects actually evolve, with two new modes:

  - **Section C — Implement a feature.** Turns a plain request ("a timer with start/stop", "a favorites list") into R-Machine's shape by decomposing it into gears (logic) + shells (localized content) + a React consumer (glue), then dispatches each piece through the existing "add a resource" flow. New `references/decompose.md` holds the forward procedure, a compact placement rubric, and a worked example.
  - **Section D — Modify or evolve.** The mode where R-Machine's "Uniformity Under Change" shows: it locates the resource that owns a behavior via its namespace, edits behind the stable contract, and **reports the blast radius** — implementation-only (zero downstream), additive (new usage only), or breaking (the exact consumers/tests `tsc` names). New `references/modify.md` carries the procedure and worked examples (including a rename that propagates into mocks instead of rotting them).

  To make a generic request (which names no R-Machine terms) reach the Skill, the **initial-setup** flow now writes a minimal, idempotent R-Machine routing stanza into the project's `CLAUDE.md` and `AGENTS.md`, telling an agent to route feature and change work through the Skill.

  It also corrects several setup/consume patterns surfaced by running the Skill against real projects:

  - **Language switcher** now shows the framework-correct plug/import (`ClientPlug` from `client-toolset` in Next, not the bare React `Plug`), and renders locale **autonyms** from a hardcoded map — the placement rule is refined to "no hardcoded **localizable** text", so locale-invariant labels are no longer a false violation.
  - **Nested server components** must not re-bind the locale: only a page/layout binds via `useR(params)`; a nested `ServerPlug` consumer takes no `params` and calls `useR()` bare (inherits the request locale).
  - **Suspense-aware tests**: the first assertion on a `Plug`/`ClientPlug` consumer must be `await findBy*` (the first render is the empty fallback).
  - **Type-name derivation** now covers hyphenated namespaces (`outer/day-counter` → `Outer_Day_Counter`).
  - **Vite/React setup**: the HMR plugin import uses an explicit `.ts` extension (nodenext), a `tsconfig.test.json` (+ its `references` entry) is specified for typed tests, and the `@/` alias uses one consistent idiom across `vite.config.ts` and `vitest.config.ts`.

## 1.0.0-alpha.14

### Patch Changes

- 7c87299: Move module loading off `RMachine.create({ load })` onto `ResourceAtlas.loader`, and split resources into `pub/` (client-safe) and `prv/` (server-only) folders — fixing a security bug where server-only `inner/` gears could leak into the Next.js client bundle.

  - **New loader API.** `ResourceAtlas.loader.register(prefixes, fn)` registers a `(path, options) => Promise<module>` loader for one or more layout prefixes, or `["*"]` as a catch-all (a prefix-specific loader wins over `"*"`). Multiple `register` calls accumulate. The `load` option on `RMachine.create(...)` is **removed**; the config now carries the loader. New error `ERR_NO_LOADER_REGISTERED` when a layout prefix has no matching loader.
  - **`pub/` + `prv/` folders.** Resources live under `pub/` (`base`/`outer`/`vertex`/`shell`) or `prv/` (`inner`), each owning a `loader.ts` whose dynamic-import glob is rooted there. `pub/loader.ts` is imported from `setup.ts`; `prv/loader.ts` is fenced with `import "server-only"` and imported only from `server-toolset.ts`, so the server-only glob never reaches the client bundle. The `pub`/`prv` segment is filesystem-only — atlas namespaces are unchanged (`base/config`, `inner/catalog`). Projects with no server-only resources use `pub/` only and register `["*"]`. `server-setup.ts` is removed.
  - **Build-safe green-field.** Because each glob is rooted at a folder that always contains its `loader.ts`, the bundler context is never empty — scaffolding the folders before adding any resource no longer breaks the first build.

## 1.0.0-alpha.13

### Patch Changes

- be0872d: Update the bundled R-Machine LLM Skill installed by `rforge skill`.

  Ships the comprehensive Skill revision so freshly installed projects get the up-to-date authoring guidance (DirectPlug, plug-attach convention, current OuterGear/BaseGear/InnerGear surface).

## 1.0.0-alpha.12

### Patch Changes

- ec6c1fc: Ground-up rewrite of R-Machine on a single unified primitive.

  This release rebuilds the entire engine around one insight: i18n and dependency
  injection are the same problem — typed, context-dependent resource resolution.
  Everything resolves through one access primitive (`Plug`) over a single resource
  model, so the same machinery powers locale-aware content, shared state, and
  injected services without separate subsystems.

  Because the surface area changed comprehensively, this entry is intentionally
  high-level rather than an exhaustive per-symbol diff. The headline themes:
  - **Unified resource model.** A single entity model (logic+state, content, and
    their fusion) resolved uniformly through `Plug`, with kind-based dependency
    scoping enforced by the type system.
  - **Architectural discipline enforced by the compiler.** Wrong wiring is
    unrepresentable rather than merely flagged; dependency declarations are
    token-based for precise, readable type errors.
  - **Per-locale architecture.** Locales are first-class and fully typed
    end-to-end, delivering zero-cost i18n readiness without per-message runtime
    negotiation.
  - **Next.js App Router integration via routing strategies** (flat / path /
    origin), with proxy-driven locale routing and a request-scoped server model
    that yields SSR's process/request two-tier caching for free.
  - **React adapter** with a per-consumer wire model, state that survives HMR, and
    opt-in React Compiler interop.
  - **`@r-machine/testing`** built on a single uniform test primitive (`mockPlug`)
    that works identically across every entity kind and on React consumers.
  - **`rforge` CLI + LLM Skill** for scaffolding and agent-assisted development,
    treating the Skill as product surface on par with the code.

  Migrating from a previous alpha: treat this as a new baseline. The public API,
  generic signatures, and configuration entry points changed throughout; follow
  the current docs and the `rforge` scaffolds rather than porting old call sites
  mechanically.
