---
"r-machine": patch
"@r-machine/react": patch
---

Fix a component rendering the previous test's state, and ignoring a new `mockPlug` controller, when one test file renders the same component more than once.

### Fixed

- **`@r-machine/react` — a wire resolved before `disposeResources()` is no longer reused.** A consumer plug caches its wires outside React, for as long as the plug itself lives. `disposeResources()` — which `mockPlug`'s reset runs when a test's `using ctrl` scope closes — tears down the slots those wires resolved against and drops their subscriptions without notifying them, so a cached wire was never marked stale and the next mount of the same component, i.e. the next test in the file, got its dead plugin back. On screen: the previous test's final state. Through the new controller: nothing — the mock's transform never ran, so `ctrl.deps[i].state = …` was silently ignored and reading `ctrl.deps[i].state` threw `ERR_STATE_NOT_RESOLVED`. A test rendering the component with no mock at all, after a mocked one, was hit the same way. Every test still passed on its own, because Vitest gives each test file a fresh module registry — so the only workaround was folding all the checks into a single test. Cache entries now record the machine's resource generation and are rebuilt once a dispose has advanced it. Next.js client components share this toolset and get the same fix.

### Added

- **`PlugMachine.getResourceGeneration()`** (`r-machine/core`) — a counter that every `disposeResources()` advances and nothing else does. Since a dispose notifies no subscriber, it is the only trace of one visible outside the machine; the React adapter keys its wire cache on it. `PlugMachine` is the bridge the adapters and `@r-machine/testing` reach through `PLUG_MACHINE_ACCESSOR`; application code does not implement it.
