# Concept — Typed mocks & LLM-first testing

The "why" behind treating tests as a default (not an extra) in R-Machine:

- `mockPlug` is **typed**. Unlike string/path-based mocks, a mock is bound to the
  resource's real surface types. When the source types change, the test **fails to
  compile** instead of passing as a false-green.
- In an LLM-aided loop, every type break is a **self-correction signal**: the
  compiler tells the agent exactly what drifted. This turns the test suite into a
  correction oracle — a differentiator vs. conventional libraries.
- Therefore the skill scaffolds tests by default and pairs every resource/consumer
  pattern with its test. See [../testing.md](../testing.md).
