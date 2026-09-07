---
"@r-machine/testing": patch
"r-machine": patch
---

Make every `mockPlug` override a deep-partial deep-merge over the real surface, with live level-0 getters.

**Deep-partial overrides.** A resolution override passed to `.with({ ... })` is now typed and applied as a `DeepPartial` **deep-merged** over the real surface — the same merge law as an action reducer and `ctrl.state`. Mock a single nested sub-key and its siblings are inherited from the real resource:

```ts
// Override only views.intro.heading — every other key comes from the real shell.
mockPlug(r).with({ showcase: (locale) => ({ views: { intro: { heading: `x-${locale}` } } }) });
```

Previously the type made nested sub-trees required in full (only level-0 keys optional) and a normal dep override replaced the whole value. This applies uniformly to deps, `$.kit` and `$.ports`.

**Live level-0 getters.** A getter passed in an override is kept live — re-read on each access instead of snapshotted at mock time — so a mock can drive a value across a test, or verify a consumer reads a dependency fresh. An override getter is a *partial*, not a whole replacement: if a real dep getter derives `foo → { a: <state>, b: 2 }`, mocking `{ foo: { b: 100 } }` and then driving `ctrl.deps.foo.state` yields `{ a: <new state>, b: 100 }` — `a` keeps tracking, `b` stays mocked. On primitive leaves the deep-merge degrades to a plain replacement, so existing string/number mocks are unchanged.

**Internals.** A new `mergeLiveOverride` in the testing layer handles level 0 (descriptor transplant + live re-merge) and delegates depth to `deepPartialMerge`, which is unchanged. `isPlainObject` is now exported from `r-machine/core`.
