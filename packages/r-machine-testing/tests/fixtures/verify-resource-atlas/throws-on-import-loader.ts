// A loader module that fails at import time — stands in for a server-only
// loader whose top-level `import "server-only"` (or any other side-effect)
// throws under the test runner. verifyResourceAtlas surfaces this as a single
// `loader-module-failed` issue.
throw new Error("loader import boom");
