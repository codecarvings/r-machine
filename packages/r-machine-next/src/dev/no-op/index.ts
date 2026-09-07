/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

// Intentionally empty.
//
// This module is the alias target for `server-only` under the jiti dev
// loader (see `create-next-dev-import.ts`). The real `server-only` package
// throws on import to fence server code out of client bundles; jiti has no
// such bundle boundary, so importing it would crash resource-module loads
// during dev HMR. Pointing the alias at an empty barrel turns the import
// into a harmless no-op while keeping the original `import "server-only"`
// statements untouched in user code (where Next still enforces them at
// build time).
export {};
